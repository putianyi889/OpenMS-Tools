let currentLevel = 'e';
let currentData = null;
const selectedKeys = new Set();

function updateUrl(levelKey) {
  const p = new URLSearchParams(location.search);
  p.set('level', levelKey);
  history.replaceState(null, '', location.pathname + '?' + p.toString());
}

function updateChart() {
  if (!currentData) return;
  const keys = [...selectedKeys].sort();
  const series = [];
  for (const key of keys) {
    const line = currentData.subtierLines.get(key);
    if (!line || !line.length) continue;
    series.push({
      label: `T${key.replace('-', '-S')}`,
      points: line,
    });
  }
  if (!series.length) {
    TierLinesRenderer.clear();
    TierLinesRenderer.setEmpty(true);
  } else {
    TierLinesRenderer.setEmpty(false);
    TierLinesRenderer.render('tierChart', series);
  }
}

async function loadAndRender(levelKey, force) {
  currentLevel = levelKey;
  updateUrl(levelKey);
  Utils.setStatus('加载中...');

  try {
    const data = await TierLoader.load(levelKey, {
      force,
      onProgress: p => {
        if (p.phase === 'load') Utils.setStatus(`读取支撑线 ${p.done}/${p.total}`);
        else if (p.phase === 'subtier') Utils.setStatus(`子分档 ${p.done}/${p.total}`);
      },
    });
    currentData = data;
    selectedKeys.clear();

    TierRenderer.render(
      document.getElementById('tierStructure'),
      data.groups,
      data.pointsByUser,
      levelKey,
      (key, checked) => {
        if (checked) selectedKeys.add(key); else selectedKeys.delete(key);
        updateChart();
      }
    );

    updateChart();
    Utils.setStatus(
      `✓ 已加载 ${data.totalUsers} 个用户 · ${data.groups.size} 档`,
      'success'
    );
  } catch (e) {
    console.error(e);
    Utils.setStatus(`失败: ${e.message}`, 'error');
  }
}

function onRecalc() {
  TierLoader.invalidate(currentLevel);
  loadAndRender(currentLevel, true);
}

function initTabs() {
  const tabs = document.getElementById('levelTabs');
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('button[data-level]');
    if (!btn) return;
    const lvl = btn.dataset.level;
    tabs.querySelectorAll('button').forEach(b =>
      b.classList.toggle('active', b === btn));
    loadAndRender(lvl, false);
  });
}

if (document.getElementById('tierStructure')) {
  initTabs();
  const p = new URLSearchParams(location.search);
  const lvl = p.get('level');
  const initial = (lvl === 'i' || lvl === 'e') ? lvl : 'e';
  document.querySelectorAll('#levelTabs button').forEach(b =>
    b.classList.toggle('active', b.dataset.level === initial));
  loadAndRender(initial, false);
}