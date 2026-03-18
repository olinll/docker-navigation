const config = require('./config');

function statusBadge(status) {
  if (status === 'static') return '';
  const map = {
    running: { dot: 'bg-emerald-400', text: 'text-emerald-500 dark:text-emerald-400', label: 'running' },
    exited:  { dot: 'bg-red-500',     text: 'text-red-500 dark:text-red-400',         label: 'exited'  },
    paused:  { dot: 'bg-amber-500',   text: 'text-amber-500 dark:text-amber-400',     label: 'paused'  },
    created: { dot: 'bg-sky-500',     text: 'text-sky-500 dark:text-sky-400',         label: 'created' },
  };
  const s = map[status] || { dot: 'bg-zinc-400', text: 'text-zinc-500 dark:text-zinc-400', label: status };
  return `<span class="inline-flex items-center gap-1.5 text-xs font-mono ${s.text}"><span class="inline-block w-1.5 h-1.5 rounded-full ${s.dot}${
    status === 'running' ? ' animate-pulse' : ''
  }"></span>${s.label}</span>`;
}

function iconEl(icon) {
  if (!icon) return `<span class="text-2xl">📦</span>`;
  if (/^https?:\/\//.test(icon) || /[\/\\]|\.[a-z]{2,5}$/i.test(icon)) {
    const src = /^https?:\/\//.test(icon) ? icon : `/static/${icon.replace(/^\//, '')}`;
    return `<img src="${src}" class="w-8 h-8 rounded object-contain" alt="" />`;
  }
  return `<span class="text-2xl">${icon}</span>`;
}

function serviceCard(service) {
  const urlAttr = service.url
    ? `href="${service.url}" target="_blank" rel="noopener noreferrer"`
    : '';
  const Tag = service.url ? 'a' : 'div';
  const hoverCls = service.url
    ? 'hover:border-indigo-400/60 dark:hover:border-indigo-500/60 hover:bg-indigo-50/50 dark:hover:bg-zinc-800/80 hover:shadow-md cursor-pointer group'
    : 'opacity-50 cursor-not-allowed';

  const externalBtn = service.externalUrl
    ? `<button
        onclick="event.preventDefault();event.stopPropagation();window.open('${service.externalUrl}','_blank','noopener,noreferrer')"
        title="外网访问: ${service.externalUrl}"
        class="flex-shrink-0 ml-1 p-1 rounded-md text-zinc-400 dark:text-zinc-600 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-zinc-700/60 transition-colors">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke-width="2"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
        </svg>
      </button>`
    : '';

  return `
  <${Tag} ${urlAttr}
    class="relative flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 p-5 transition-all duration-200 ${hoverCls}">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-700/60 flex items-center justify-center">
          ${iconEl(service.icon)}
        </div>
        <div class="min-w-0">
          <div class="font-semibold text-zinc-800 dark:text-zinc-100 text-sm leading-tight ${
            service.url ? 'group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors' : ''
          }">${service.title}</div>
          <div class="text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">${service.containerName || ''}${service.port ? `:${service.port}` : ''}</div>
        </div>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0">
        ${statusBadge(service.status)}
        ${externalBtn}
      </div>
    </div>
    ${
      service.description
        ? `<p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">${service.description}</p>`
        : ''
    }
    ${
      service.url
        ? `<div class="text-xs text-zinc-400 dark:text-zinc-600 font-mono truncate group-hover:text-indigo-500 dark:group-hover:text-indigo-400/70 transition-colors">${service.externalUrl || service.url}</div>`
        : `<div class="text-xs text-zinc-400 dark:text-zinc-600 italic">no url configured</div>`
    }
  </${Tag}>`;
}

function groupSection(group) {
  return `
  <section class="mb-10">
    <div class="flex items-center gap-3 mb-4">
      <h2 class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">${group.name}</h2>
      <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
      <span class="text-xs text-zinc-400 dark:text-zinc-600">${group.services.length}</span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      ${group.services.map(serviceCard).join('')}
    </div>
  </section>`;
}

function renderPage(data) {
  const { groups, total, updatedAt } = data;
  const refreshScript = config.REFRESH_INTERVAL > 0
    ? `<script>setTimeout(()=>location.reload(),${config.REFRESH_INTERVAL});</script>`
    : '';
  const updatedLocal = new Date(updatedAt).toLocaleString();

  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.SITE_TITLE}</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%234f46e5'/%3E%3Cg fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='6' y='6' width='8' height='8' rx='1'/%3E%3Crect x='18' y='6' width='8' height='8' rx='1'/%3E%3Crect x='6' y='18' width='8' height='8' rx='1'/%3E%3Cpath d='M18 22h8M22 18v8'/%3E%3C/g%3E%3C/svg%3E" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { darkMode: 'class' };</script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 3px; }
    .dark ::-webkit-scrollbar-thumb { background: #3f3f46; }
  </style>
  <script>
    // 初始化主题：优先读 localStorage，否则跟随系统
    (function() {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.classList.add('dark');
      }
    })();
  </script>
</head>
<body class="bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 min-h-screen transition-colors duration-200">

  <!-- Header -->
  <header class="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="4" width="10" height="10" rx="2"/>
              <rect x="18" y="4" width="10" height="10" rx="2"/>
              <rect x="4" y="18" width="10" height="10" rx="2"/>
              <path d="M18 23h10M23 18v10"/>
            </g>
          </svg>
        </div>
        <span class="font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">${config.SITE_TITLE}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-zinc-400 font-mono hidden sm:block">${total} 个服务</span>
        <button onclick="location.reload()"
          class="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors font-mono">
          ↻ refresh
        </button>
        <!-- 主题切换按钮 -->
        <button id="theme-toggle" onclick="toggleTheme()"
          class="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
          title="切换主题">
          <span id="theme-icon"></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main -->
  <main class="max-w-7xl mx-auto px-6 py-8">
    ${
      groups.length === 0
        ? `<div class="flex flex-col items-center justify-center py-32 text-zinc-400">
            <div class="text-5xl mb-4">🐳</div>
            <div class="text-lg font-semibold mb-2 text-zinc-600 dark:text-zinc-400">No services found</div>
            <div class="text-sm">Make sure containers are running and ports are mapped.</div>
           </div>`
        : groups.map(groupSection).join('')
    }
  </main>

  <!-- Footer -->
  <footer class="border-t border-zinc-200 dark:border-zinc-800/50 mt-12">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center">
      ${ config.REFRESH_INTERVAL > 0
        ? `<span class="text-xs text-zinc-300 dark:text-zinc-700">auto-refresh every ${config.REFRESH_INTERVAL / 1000}s</span>`
        : '<span></span>' }
      <a href="https://github.com/olinll/docker-navigation" target="_blank" rel="noopener noreferrer"
        class="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
        olinll/docker-navigation
      </a>
    </div>
  </footer>

  <script>
    // 更新图标
    function updateIcon() {
      var isDark = document.documentElement.classList.contains('dark');
      var sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
      var moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path></svg>';
      document.getElementById('theme-icon').innerHTML = isDark ? sunIcon : moonIcon;
    }

    // 切换主题
    function toggleTheme() {
      const html = document.documentElement;
      const isDark = html.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateIcon();
    }

    // 监听系统主题变化（仅当用户未手动设置时）
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.classList.toggle('dark', e.matches);
        updateIcon();
      }
    });

    updateIcon();
  </script>
  ${refreshScript}
</body>
</html>`;
}

module.exports = { renderPage };
