const Docker = require('dockerode');
const config = require('./config');
const { loadStaticServices } = require('./static-services');

// 连接 Docker（支持 TCP 和 Socket）
function buildDockerOpts() {
  const host = config.DOCKER_SOCKET || '';
  const tcpMatch = host.match(/^tcp:\/\/([^:]+):(\d+)$/);
  if (tcpMatch) {
    return { host: tcpMatch[1], port: parseInt(tcpMatch[2], 10), protocol: 'http' };
  }
  // 回退到 socket
  return { socketPath: host || '/var/run/docker.sock' };
}
const docker = new Docker(buildDockerOpts());

/**
 * 解析容器 Labels 中的 nav.* 配置
 */
function parseLabels(labels = {}) {
  const nav = {
    enable: labels['nav.enable'],
    title: labels['nav.title'] || null,
    description: labels['nav.description'] || '',
    icon: labels['nav.icon'] || null,
    group: labels['nav.group'] || 'Other',
    url: labels['nav.url'] || null,
    externalUrl: labels['nav.external_url'] || null,
    ports: {},
  };

  // 解析 nav.port.{port}.title / nav.port.{port}.url / nav.port.{port}.enable
  for (const [key, value] of Object.entries(labels)) {
    const match = key.match(/^nav\.port\.(\d+)\.(title|url|description|enable)$/);
    if (match) {
      const port = match[1];
      const field = match[2];
      if (!nav.ports[port]) nav.ports[port] = {};
      nav.ports[port][field] = value;
    }
  }

  return nav;
}

/**
 * 从容器信息中生成服务条目列表
 * 一个容器可能产生多个服务条目（多端口）
 */
function buildServiceEntries(containerInfo) {
  const { Names, State, Labels, Ports } = containerInfo;
  const name = (Names[0] || '').replace(/^\//, '');
  const status = State;
  const nav = parseLabels(Labels || {});

  // STRICT_MODE: 只显示 nav.enable=true 的容器
  if (config.STRICT_MODE && nav.enable !== 'true') return [];

  // 非 STRICT_MODE: 跳过明确设置 nav.enable=false 的容器
  if (!config.STRICT_MODE && nav.enable === 'false') return [];

  const entries = [];

  // 如果有手动指定的 nav.url，生成单个条目
  if (nav.url) {
    entries.push({
      id: `${name}-manual`,
      containerName: name,
      title: nav.title || name,
      description: nav.description,
      icon: nav.icon,
      group: nav.group,
      url: nav.url,
      externalUrl: nav.externalUrl,
      status,
      port: null,
    });
    return entries;
  }

  // 获取有宿主机映射的端口列表，按 PrivatePort 去重（避免 IPv4/IPv6 重复）
  const seenPorts = new Set();
  const mappedPorts = (Ports || []).filter((p) => {
    if (!p.PublicPort || !p.IP) return false;
    const key = `${p.PrivatePort}:${p.PublicPort}`;
    if (seenPorts.has(key)) return false;
    seenPorts.add(key);
    return true;
  });

  if (mappedPorts.length === 0) {
    // 无端口映射且非 STRICT_MODE，跳过
    if (!config.STRICT_MODE || nav.enable !== 'true') return [];
    // STRICT_MODE 且明确启用，生成无 URL 条目
    entries.push({
      id: `${name}-noport`,
      containerName: name,
      title: nav.title || name,
      description: nav.description,
      icon: nav.icon,
      group: nav.group,
      url: null,
      status,
      port: null,
    });
    return entries;
  }

  // 每个端口生成一个条目
  for (const p of mappedPorts) {
    const hostPort = String(p.PublicPort);
    const portNav = nav.ports[hostPort] || nav.ports[String(p.PrivatePort)] || {};

    // 跳过明确禁用的端口
    if (portNav.enable === 'false') continue;

    const title = portNav.title
      ? portNav.title
      : nav.title
        ? (mappedPorts.length > 1 ? `${nav.title} :${hostPort}` : nav.title)
        : `${name} :${hostPort}`;

    const url = portNav.url || `http://${config.HOST_IP}:${hostPort}`;

    entries.push({
      id: `${name}-${hostPort}`,
      containerName: name,
      title,
      description: portNav.description || nav.description,
      icon: nav.icon,
      group: nav.group,
      url,
      externalUrl: portNav.external_url || nav.externalUrl || null,
      status,
      port: hostPort,
    });
  }

  return entries;
}

/**
 * 获取所有服务，按 group 分组返回
 * @returns {{ groups: { name: string, services: Array }[], total: number, updatedAt: string }}
 */
async function getServices() {
  const containers = await docker.listContainers({ all: true });

  // 静态服务（来自 services.yaml）
  const staticEntries = loadStaticServices();

  // 记录静态分组的出现顺序（按 yaml 中先后顺序）
  const staticGroupOrder = [];
  for (const e of staticEntries) {
    if (!staticGroupOrder.includes(e.group)) staticGroupOrder.push(e.group);
  }
  const staticGroups = new Set(staticGroupOrder);

  // Docker 自动探测服务
  const dockerEntries = [];
  for (const c of containers) {
    const entries = buildServiceEntries(c);
    dockerEntries.push(...entries);
  }

  // Docker 服务按 title 字母排序
  dockerEntries.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));

  const allEntries = [...staticEntries, ...dockerEntries];

  // 按 group 分组，保留插入顺序（静态在前）
  const groupMap = new Map();
  for (const entry of allEntries) {
    if (!groupMap.has(entry.group)) groupMap.set(entry.group, []);
    groupMap.get(entry.group).push(entry);
  }

  // 排序规则：
  //   1. 静态服务的分组按 yaml 中出现顺序排最前
  //   2. Docker 探测的非 Other 分组按字母排序
  //   3. Other 永远最后
  const groups = Array.from(groupMap.entries())
    .sort(([a], [b]) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      const aIdx = staticGroupOrder.indexOf(a);
      const bIdx = staticGroupOrder.indexOf(b);
      const aStatic = staticGroups.has(a);
      const bStatic = staticGroups.has(b);
      // 两个都是静态分组：按 yaml 顺序
      if (aStatic && bStatic) return aIdx - bIdx;
      // 一个静态一个非静态：静态在前
      if (aStatic && !bStatic) return -1;
      if (!aStatic && bStatic) return 1;
      // 两个都是 Docker 分组：按字母
      return a.localeCompare(b);
    })
    .map(([name, services]) => ({ name, services }));

  return {
    groups,
    total: allEntries.length,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = { getServices };
