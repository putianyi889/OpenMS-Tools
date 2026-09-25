const pbRenderer = new PBRenderer(PB_LEVELS);
const MODE_KEY = 'openms_pb_display_mode';
let currentData = null;
let currentMode = 'time';

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
  currentMode = mode;
  PB_LEVELS.forEach(lv => lv.setDisplayMode(mode));
  try { localStorage.setItem(MODE_KEY, mode); } catch {}

  document.querySelectorAll('.pb-mode-switch button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (currentData) {
    pbRenderer.renderAll(document.getElementById('pbContent'), currentData);
  }
}

/** 从 pbs 缓存里取出每个等级的 bv → rank 映射 */
function applyRankMaps(pbs) {
  for (const level of PB_LEVELS) {
    const map = new Map();
    for (const r of pbs) {
      if (r.level === level.key && typeof r.rank === 'number') {
        map.set(Number(r.bv), r.rank);
      }
    }
    level.setRankMap(map);
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

/** 后台加载 pbs 缓存并注入 rank；若当前为 rank 模式则重渲染 */
async function loadRanks(videos) {
  const uid = Utils.getUserId();
  if (!uid) return;
  try {
    let pbs = await PBCache.getByUser(uid);
    if (!pbs.length && videos.length) {
      // 首次访问：计算 PB 并写入（此时 rank 为 null）
      await PBCache.writeFromVideos(uid, videos, PB_LEVELS);
      pbs = await PBCache.getByUser(uid);
    }
    applyRankMaps(pbs);
    if (currentMode === 'rank') {
      pbRenderer.renderAll(document.getElementById('pbContent'), videos);
    }
  } catch (e) {
    console.warn('加载 PB 排名失败', e);
  }
}

if (document.getElementById('pbContent')) {
  setupModeSwitch();
  applyMode(getInitialMode());
  loadPageData(videos => {
    currentData = videos;
    pbRenderer.renderAll(document.getElementById('pbContent'), videos);
    loadRanks(videos);
  });
}