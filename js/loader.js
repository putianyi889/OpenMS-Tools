(async function () {
  const entry = (document.currentScript.dataset.entry || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  const loaded = new Set();
  const inflight = new Map();

  function load(name) {
    if (loaded.has(name)) return Promise.resolve();
    if (inflight.has(name)) return inflight.get(name);

    const def = DEPS[name];
    if (!def) return Promise.reject(new Error(`未定义模块: ${name}`));

    const { src, deps = [] } =
      typeof def === 'string' ? { src: def } : def;

    const p = (async () => {
      await Promise.all(deps.map(load));   // 先加载依赖
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error(`加载失败: ${src}`));
        document.head.appendChild(s);
      });
      loaded.add(name);
    })();

    inflight.set(name, p);
    return p;
  }

  try {
    await Promise.all(entry.map(load));
    document.dispatchEvent(new Event('scripts-ready'));
  } catch (e) {
    console.error('[loader]', e);
    const el = document.getElementById('status');
    if (el) { el.textContent = '脚本加载失败：' + e.message; el.className = 'status error'; }
  }
})();