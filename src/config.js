require('dotenv').config();

module.exports = {
  // 服务监听端口
  PORT: parseInt(process.env.PORT || '3000', 10),

  // Docker 连接地址，支持 TCP 或 Socket 路径
  // TCP 示例: tcp://10.0.0.40:2375
  // Socket 示例: /var/run/docker.sock
  DOCKER_SOCKET: process.env.DOCKER_SOCKET || '/var/run/docker.sock',

  // 宿主机 IP，用于生成容器访问链接
  HOST_IP: process.env.HOST_IP || '127.0.0.1',

  // 页面标题
  SITE_TITLE: process.env.SITE_TITLE || 'Docker Dashboard',

  // 自动刷新间隔（毫秒），0 表示关闭
  REFRESH_INTERVAL: parseInt(process.env.REFRESH_INTERVAL || '0', 10),

  // 是否只显示有 nav.enable=true 的容器（默认 false = 显示所有有端口映射的容器）
  STRICT_MODE: process.env.STRICT_MODE === 'true',
};
