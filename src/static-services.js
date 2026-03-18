const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const YAML_PATH = process.env.SERVICES_YAML
  || path.join(process.cwd(), 'services.yaml');

/**
 * 读取 services.yaml，返回静态服务条目列表
 * 文件不存在时返回空数组
 */
function loadStaticServices() {
  if (!fs.existsSync(YAML_PATH)) return [];

  try {
    const raw = fs.readFileSync(YAML_PATH, 'utf8');
    const doc = yaml.load(raw);
    const services = (doc && Array.isArray(doc.services)) ? doc.services : [];

    return services
      .filter((s) => s && s.title && s.url)
      .map((s, i) => ({
        id: `static-${i}-${s.title}`,
        containerName: null,
        title: s.title,
        description: s.description || '',
        icon: s.icon || null,
        group: s.group || 'Pinned',
        url: s.url,
        externalUrl: s.external_url || null,
        status: 'static',
        port: null,
      }));
  } catch (err) {
    console.error('[docker-index] Failed to load services.yaml:', err.message);
    return [];
  }
}

module.exports = { loadStaticServices };
