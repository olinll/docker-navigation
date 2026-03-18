# docker-navigation

> 本项目由 AI 全程辅助开发，代码、文档均由 AI 生成。

**GitHub**: [olinll/docker-navigation](https://github.com/olinll/docker-navigation)  
**Docker Hub**: [olinl/docker-navigation](https://hub.docker.com/r/olinl/docker-navigation)

自动探测 Docker 容器并生成导航页面的轻量服务。通过读取容器的端口映射和 Label 配置，自动生成一个可访问的服务导航页。支持深色/浅色主题切换，支持通过 `services.yaml` 手动添加非 Docker 服务。

## 快速开始

### Docker Compose（推荐）

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

### 本地开发

```bash
npm install
npm start        # 生产模式
npm run dev      # 开发模式（文件变更自动重启）
```

## 环境变量

复制 `.env.example` 为 `.env` 并按需修改：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3000` | 服务监听端口 |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Docker 连接地址，支持 Socket 路径或 TCP 地址 |
| `HOST_IP` | `127.0.0.1` | 宿主机 IP，用于自动生成容器访问链接 |
| `SITE_TITLE` | `Docker Dashboard` | 页面标题 |
| `REFRESH_INTERVAL` | `0` | 自动刷新间隔（毫秒），`0` 表示关闭 |
| `STRICT_MODE` | `false` | `true` 时只显示有 `nav.enable=true` 的容器 |
| `SERVICES_YAML` | `services.yaml` | 静态服务配置文件路径 |

**DOCKER_SOCKET 格式示例：**

```
# Unix Socket（Linux/Mac 本地，默认）
DOCKER_SOCKET=/var/run/docker.sock

# TCP（需要 Docker 开启远程 API）
DOCKER_SOCKET=tcp://192.168.1.100:2375

# Windows Docker Desktop 命名管道
DOCKER_SOCKET=//./pipe/docker_engine
```

## Label 配置说明

docker-navigation 通过读取容器的 Docker Label 来定制每个服务的展示信息。

### 基础 Label

| Label | 说明 | 示例值 |
|---|---|---|
| `nav.enable` | 是否在导航页显示。`STRICT_MODE=false` 时默认显示所有有端口映射的容器；设为 `false` 可强制隐藏 | `true` / `false` |
| `nav.title` | 服务名称，不设置则使用容器名 | `Gitea` |
| `nav.description` | 服务描述，显示在卡片下方 | `自托管 Git 服务` |
| `nav.icon` | 图标，支持 emoji、图片 URL 或本地路径（挂载 `./ico` 后可用） | `🦊` 或 `https://example.com/icon.png` 或 `ico/nas.webp` |
| `nav.group` | 分组名称，同组服务会归类展示，未设置归入 `Other` | `Dev Tools` |
| `nav.url` | 手动指定访问地址，设置后忽略端口自动探测，只生成一个卡片 | `https://git.example.com` |
| `nav.external_url` | 外网访问地址，卡片右上角显示地球图标，点击跳转 | `https://git.example.com` |

### 多端口 Label

当一个容器映射了多个端口时，默认每个端口生成一个服务卡片。可以为每个端口单独配置：

| Label | 说明 | 示例值 |
|---|---|---|
| `nav.port.{端口号}.title` | 指定该端口的服务名称 | `Web UI` |
| `nav.port.{端口号}.description` | 指定该端口的描述 | `管理后台` |
| `nav.port.{端口号}.url` | 指定该端口的访问地址，覆盖自动生成的链接 | `https://app.example.com` |
| `nav.port.{端口号}.enable` | 设为 `false` 可隐藏该端口，不生成卡片 | `false` |

> `{端口号}` 填写**宿主机映射的端口**（即 `ports:` 中冒号左侧的端口）。

## services.yaml 静态服务

除了自动探测 Docker 容器，还可以通过 `services.yaml` 手动添加路由器、NAS 等非 Docker 服务。静态服务显示在导航页最顶端，Docker 自动探测的服务排在后面。

```yaml
# services.yaml
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

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 服务名称 |
| `url` | 是 | 访问地址 |
| `description` | 否 | 服务描述 |
| `icon` | 否 | emoji、图片 URL 或本地路径 |
| `group` | 否 | 分组名称，默认 `Pinned` |
| `external_url` | 否 | 外网访问地址 |

## 配置示例

### 单端口服务

```yaml
services:
  gitea:
    image: gitea/gitea
    ports:
      - "3000:3000"
    labels:
      - "nav.title=Gitea"
      - "nav.description=自托管 Git 服务"
      - "nav.icon=🦊"
      - "nav.group=Dev Tools"
```

### 多端口服务（分别命名）

```yaml
services:
  openlist:
    image: openlist/openlist
    ports:
      - "5244:5244"   # Web UI
      - "5246:5246"   # API
    labels:
      - "nav.title=OpenList"
      - "nav.description=文件列表服务"
      - "nav.icon=📂"
      - "nav.group=Tools"
      - "nav.port.5244.title=Web UI"
      - "nav.port.5246.title=API"
      - "nav.port.5246.description=OpenList API 接口"
      - "nav.port.5246.enable=false"   # 隐藏 API 端口卡片
```

### 使用自定义 URL（如反代域名）

```yaml
services:
  bitwarden:
    image: vaultwarden/server
    ports:
      - "8080:80"
    labels:
      - "nav.title=Vaultwarden"
      - "nav.description=密码管理器"
      - "nav.icon=🔐"
      - "nav.group=Security"
      - "nav.url=https://vault.example.com"          # 使用反代地址，忽略端口探测
      - "nav.external_url=https://vault.example.com" # 外网地址
```

### 隐藏某个容器

```yaml
labels:
  - "nav.enable=false"
```

### 只显示指定容器（严格模式）

在 `.env` 中设置 `STRICT_MODE=true`，然后只给需要显示的容器加 `nav.enable=true`：

```yaml
labels:
  - "nav.enable=true"
  - "nav.title=My Service"
```

## API

| 路径 | 说明 |
|---|---|
| `GET /` | 导航页面（HTML） |
| `GET /api/services` | 原始服务数据（JSON） |
| `GET /health` | 健康检查 |
