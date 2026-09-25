const pbRenderer = new PBRenderer(PB_LEVELS);
const MODE_KEY = 'openms_pb_display_mode';
let currentData = null;

function getInitialMode() {
  const url = new URLSearchParams(location.search).get('display');
  if (PBLevel.MODES.includes(url)) return url;
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (PBLevel.MODES.includes(saved)) return saved;
  } catch {}
  return 'time';
}

function applyMode(mode) {
  PB_LEVELS.forEach(lv => lv.setDisplayMode(mode));
  try { localStorage.setItem(MODE_KEY, mode); } catch {}

  document.querySelectorAll('.pb-mode-switch button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (currentData) {
    pbRenderer.renderAll(document.getElementById('pbContent'), currentData);
  }
}

function setupModeSwitch() {
  const wrap = document.querySelector('.pb-mode-switch');
  if (!wrap) return;
  wrap.addEventListener('click', e => {
    const btn = e.target.closest('button[data-mode]');
    if (!btn) return;
    applyMode(btn.dataset.mode);
  });
}

if (document.getElementById('pbContent')) {
  setupModeSwitch();
  applyMode(getInitialMode());
  loadPageData(data => {
    currentData = data;
    pbRenderer.renderAll(document.getElementById('pbContent'), data);

    // 后台计算并缓存该用户的 PB，不阻塞渲染
    const uid = Utils.getUserId();
    PBCache.writeFromVideos(uid, data, PB_LEVELS)
      .then(n => console.log(`已缓存 ${n} 条 PB（用户 ${uid}）`))
      .catch(e => console.warn('PB 缓存失败', e));
  });
}