require('dotenv').config();
const express = require('express');
const config = require('./config');
const { getServices } = require('./docker');
const { renderPage } = require('./render');

const path = require('path');
const app = express();

// 静态文件服务（用于本地图标，如 ico/1panel.webp）
// 访问路径: /static/ico/1panel.webp → 项目根目录/ico/1panel.webp
app.use('/static', express.static(path.join(process.cwd(), '.')));

// 导航页
app.get('/', async (req, res) => {
  try {
    const data = await getServices();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderPage(data));
  } catch (err) {
    console.error('[docker-index] Error fetching containers:', err.message);
    res.status(500).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="zh" class="dark">
<head>
  <meta charset="UTF-8" />
  <title>Error — docker-index</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center">
  <div class="text-center">
    <div class="text-5xl mb-4">⚠️</div>
    <h1 class="text-xl font-semibold mb-2">Failed to connect to Docker</h1>
    <p class="text-zinc-400 text-sm mb-4">${err.message}</p>
    <p class="text-zinc-600 text-xs font-mono">DOCKER_SOCKET: ${config.DOCKER_SOCKET}</p>
    <button onclick="location.reload()" class="mt-6 text-sm border border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-500 transition-colors">
      ↻ retry
    </button>
  </div>
</body>
</html>`);
  }
});

// JSON API（调试用）
app.get('/api/services', async (req, res) => {
  try {
    const data = await getServices();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 健康检查
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(config.PORT, () => {
  console.log(`[docker-index] Running at http://localhost:${config.PORT}`);
  console.log(`[docker-index] Docker socket: ${config.DOCKER_SOCKET}`);
  console.log(`[docker-index] Host IP: ${config.HOST_IP}`);
  console.log(`[docker-index] Strict mode: ${config.STRICT_MODE}`);
});
