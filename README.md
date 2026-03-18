# docker-index

> 本项目由 AI 全程辅助开发，代码、文档均由 AI 生成。

自动探测 Docker 容器并生成导航页面的轻量服务。通过读取容器的端口映射和 Label 配置，自动生成一个可访问的服务导航页。

## 快速开始

```bash
npm install
npm start
```

服务默认运行在 `http://localhost:3000`。

## 环境变量

复制 `.env.example` 为 `.env` 并按需修改：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3000` | 服务监听端口 |
| `DOCKER_HOST` | `tcp://10.0.0.40:2375` | Docker 连接地址，支持 TCP 或 Socket |
| `HOST_IP` | `10.0.0.40` | 宿主机 IP，用于自动生成容器访问链接 |
| `SITE_TITLE` | `Docker Dashboard` | 页面标题 |
| `REFRESH_INTERVAL` | `0` | 自动刷新间隔（毫秒），`0` 表示关闭 |
| `STRICT_MODE` | `false` | `true` 时只显示有 `nav.enable=true` 的容器 |

**DOCKER_HOST 格式示例：**

```
# TCP（需要 Docker 开启远程 API）
DOCKER_HOST=tcp://192.168.1.100:2375

# Unix Socket（Linux/Mac 本地）
DOCKER_HOST=/var/run/docker.sock

# Windows Docker Desktop 命名管道
DOCKER_HOST=//./pipe/docker_engine
```

## Label 配置说明

docker-index 通过读取容器的 Docker Label 来定制每个服务的展示信息。

### 基础 Label

| Label | 说明 | 示例值 |
|---|---|---|
| `nav.enable` | 是否在导航页显示。`STRICT_MODE=false` 时默认显示所有有端口映射的容器；设为 `false` 可强制隐藏 | `true` / `false` |
| `nav.title` | 服务名称，不设置则使用容器名 | `Gitea` |
| `nav.description` | 服务描述，显示在卡片下方 | `自托管 Git 服务` |
| `nav.icon` | 图标，支持 emoji 或图片 URL | `🦊` 或 `https://example.com/icon.png` |
| `nav.group` | 分组名称，同组服务会归类展示，未设置归入 `Other` | `Dev Tools` |
| `nav.url` | 手动指定访问地址，设置后忽略端口自动探测，只生成一个卡片 | `https://git.example.com` |

### 多端口 Label

当一个容器映射了多个端口时，默认每个端口生成一个服务卡片。可以为每个端口单独配置标题、描述和访问地址：

| Label | 说明 | 示例值 |
|---|---|---|
| `nav.port.{端口号}.title` | 指定该端口的服务名称 | `Web UI` |
| `nav.port.{端口号}.description` | 指定该端口的描述 | `管理后台` |
| `nav.port.{端口号}.url` | 指定该端口的访问地址，覆盖自动生成的链接 | `https://app.example.com` |

> `{端口号}` 填写**宿主机映射的端口**（即 `ports:` 中冒号左侧的端口）。

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
      - "nav.url=https://vault.example.com"  # 使用反代地址，忽略端口探测
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

## Docker Compose 部署

```yaml
services:
  docker-index:
    image: node:20-alpine
    container_name: docker-index
    working_dir: /app
    command: node src/index.js
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - HOST_IP=192.168.1.100
      - SITE_TITLE=My Dashboard
    labels:
      - "nav.enable=false"  # 不把自己显示在导航页
```

## API

| 路径 | 说明 |
|---|---|
| `GET /` | 导航页面（HTML） |
| `GET /api/services` | 原始服务数据（JSON） |
| `GET /health` | 健康检查 |
