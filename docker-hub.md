# docker-navigation

一个轻量级的 Docker 容器导航页，自动探测运行中的容器并生成美观的服务导航面板。支持深色/浅色主题切换，无需数据库，开箱即用。

> 本项目由 AI 全程辅助开发。

**GitHub**: [olinll/docker-navigation](https://github.com/olinll/docker-navigation)  
**Docker Hub**: [olinl/docker-navigation](https://hub.docker.com/r/olinl/docker-navigation)

---

## 功能特性

- **自动探测** — 通过 Docker Socket / TCP 自动发现运行中的容器
- **Label 驱动** — 通过 Docker Label 自定义服务名称、描述、图标、分组
- **多端口支持** — 一个容器多个端口，自动展开为多个服务卡片
- **静态服务** — 通过 `services.yaml` 手动添加路由器、NAS 等非 Docker 服务
- **外网地址** — 为每个服务配置内外网双地址，卡片右上角一键跳转外网
- **深色/浅色主题** — 默认跟随系统，支持手动切换并记住偏好
- **本地图标** — 支持 emoji、HTTP URL、本地图片文件三种图标格式
- **分组排序** — 静态服务分组优先显示，Docker 服务按名称排序，Other 组置底

---

## 快速开始

### Docker Compose（推荐）

创建 `docker-compose.yml`：

```yaml
services:
  docker-index:
    image: olinl/docker-navigation:latest
    container_name: docker-index
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./services.yaml:/app/services.yaml:ro
      - ./ico:/app/ico:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - HOST_IP=192.168.1.100     # 改为你的宿主机 IP
      - SITE_TITLE=My Dashboard
      # - DOCKER_SOCKET=tcp://10.0.0.40:2375  # 使用 TCP 时取消注释并删除 socket 挂载
```

```bash
docker compose up -d
```

访问 `http://localhost:3000` 即可看到导航页。

---

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3000` | 服务监听端口 |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Docker 连接地址（Socket 路径或 TCP 地址） |
| `HOST_IP` | `127.0.0.1` | 宿主机 IP，用于生成容器访问链接 |
| `SITE_TITLE` | `Docker Dashboard` | 页面标题 |
| `REFRESH_INTERVAL` | `0` | 自动刷新间隔（毫秒），`0` 关闭 |
| `STRICT_MODE` | `false` | `true` 时只显示有 `nav.enable=true` 的容器 |
| `SERVICES_YAML` | `services.yaml` | 静态服务配置文件路径 |

---

## Docker Label 配置

```yaml
labels:
  - "nav.title=Gitea"                          # 服务名称
  - "nav.description=自托管 Git 服务"           # 描述
  - "nav.icon=🦊"                              # emoji / URL / 本地路径
  - "nav.group=Dev Tools"                      # 分组
  - "nav.external_url=https://git.example.com" # 外网地址
  - "nav.port.5246.enable=false"               # 隐藏指定端口
```

---

## services.yaml 静态服务

```yaml
services:
  - title: Router
    url: http://192.168.1.1
    description: 路由器管理后台
    icon: "🌐"
    group: Network
    external_url: https://router.example.com

  - title: NAS
    url: http://10.0.0.10:5000
    icon: "ico/nas.webp"   # 挂载 ./ico 目录后可用本地图标
    group: Storage
```

---

## API

| 路径 | 说明 |
|---|---|
| `GET /` | 导航页面 |
| `GET /api/services` | 服务数据（JSON） |
| `GET /health` | 健康检查 |
