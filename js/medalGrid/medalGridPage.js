const mgRenderer = new MedalGridRenderer(PB_LEVELS);
let currentRank = 1;

function getRankFromUrl() {
  const p = new URLSearchParams(location.search);
  const r = parseInt(p.get('rank'), 10);
  return Number.isFinite(r) && r >= 1 ? r : 1;
}

function updateUrl(rank) {
  const p = new URLSearchParams(location.search);
  p.set('rank', rank);
  history.replaceState(null, '', location.pathname + '?' + p.toString());
}

async function renderCurrentRank() {
  const rank = currentRank;
  Utils.setStatus('收集用户...');

  // 收集所有需要的 userId
  const userIds = new Set();
  for (const pos of MedalGridData.positionsAtRank(rank)) {
    const level = PB_LEVELS.find(l => l.key === pos.level);
    if (!level) continue;
    const records = MedalGridData.getAtRank(level.key, pos.bv, rank);
    for (const r of records) {
      if (r.userId != null) userIds.add(String(r.userId));
    }
  }

  let userMap = new Map();
  if (userIds.size) {
    Utils.setStatus('拉取用户信息...');
    try {
      userMap = await UserCache.ensureUsers([...userIds], p => {
        if (p.phase === 'fetch' && p.total) {
          Utils.setStatus(`拉取用户信息 ${p.done}/${p.total}`);
        }
      });
    } catch (e) {
      console.warn('用户信息拉取失败，使用 #id 兜底', e);
    }
  }

  mgRenderer.renderAll(
    document.getElementById('mgContent'), rank, userMap
  );
  Utils.setStatus(
    `✓ Rank ${rank} · ${userIds.size} 位用户`,
    'success'
  );
}

async function onRankChange(newRank) {
  if (newRank < 1 || newRank === currentRank) return;
  currentRank = newRank;
  updateUrl(newRank);
  document.getElementById('rankInput').value = newRank;
  await renderCurrentRank();
}

async function initMedalGridPage() {
  if (!document.getElementById('mgContent')) return;

  Utils.setStatus('读取 PB 缓存...');
  try {
    const info = await MedalGridData.load();
    if (!info.pbs) {
      Utils.setStatus('PB 缓存为空，请先访问 PB 页面或重算 PB', 'error');
      document.getElementById('mgContent').innerHTML =
        `<div class="mg-empty-state">暂无 PB 缓存</div>`;
      return;
    }
  } catch (e) {
    Utils.setStatus(`加载失败: ${e.message}`, 'error');
    return;
  }

  currentRank = getRankFromUrl();
  document.getElementById('rankInput').value = currentRank;
  await renderCurrentRank();
}

if (document.getElementById('mgContent')) {
  const input = document.getElementById('rankInput');
  input.addEventListener('change', e => {
    const v = parseInt(e.target.value, 10);
    if (Number.isFinite(v) && v >= 1) onRankChange(v);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const v = parseInt(e.target.value, 10);
      if (Number.isFinite(v) && v >= 1) onRankChange(v);
    }
  });
  initMedalGridPage();
}