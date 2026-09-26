let currentLevel = null;
let currentSortKey = 'sumRank';
let currentRows = null;
let currentUserMap = new Map();
let currentHasWeights = false;

function levelByKey(key) {
  return PB_LEVELS.find(l => l.key === key) || PB_LEVELS[0];
}

function initLevelSelect() {
  const sel = document.getElementById('levelSelect');
  sel.innerHTML = '';
  for (const lv of PB_LEVELS) {
    const opt = document.createElement('option');
    opt.value = lv.key;
    opt.textContent = `${lv.label} 级`;
    sel.appendChild(opt);
  }
}

function renderHead() {
  const cols = PBRankData.COLS;
  document.getElementById('rankHead').innerHTML = `<tr>
    <th class="col-rank">排名</th>
    <th>用户</th>
    ${cols.map(c =>
      `<th class="col-num sortable" data-key="${c.key}">${c.label}</th>`
    ).join('')}
  </tr>`;
  updateHeadHighlight();
}

function updateHeadHighlight() {
  document.querySelectorAll('#rankHead th.sortable').forEach(th => {
    th.classList.toggle('active', th.dataset.key === currentSortKey);
  });
}

function render() {
  PBRankRenderer.render(
    'rankBody', currentRows, currentLevel, currentSortKey,
    currentUserMap, currentHasWeights
  );
  updateHeadHighlight();
}

async function load() {
  Utils.setStatus('计算中...');
  try {
    const { rows, hasWeights } = await PBRankData.compute(currentLevel);
    currentRows = rows;
    currentHasWeights = hasWeights;

    if (!rows.length) {
      Utils.setStatus('该等级暂无 PB 缓存', 'error');
      document.getElementById('rankBody').innerHTML = '';
      return;
    }

    Utils.setStatus('拉取用户信息...');
    const ids = rows.map(r => r.userId);
    try { currentUserMap = await UserCache.ensureUsers(ids); }
    catch (e) { console.warn('用户信息拉取失败', e); }

    render();
    Utils.setStatus(`✓ 共 ${rows.length} 位用户`, 'success');
  } catch (e) {
    console.error(e);
    Utils.setStatus(`失败: ${e.message}`, 'error');
  }
}

function onHeadClick(e) {
  const th = e.target.closest('th.sortable');
  if (!th) return;
  const key = th.dataset.key;
  if (key === currentSortKey) return;
  currentSortKey = key;
  render();
}

function onLevelChange() {
  currentLevel = levelByKey(document.getElementById('levelSelect').value);
  const p = new URLSearchParams(location.search);
  p.set('level', currentLevel.key);
  history.replaceState(null, '', location.pathname + '?' + p.toString());
  load();
}

function init() {
  if (!document.getElementById('rankTable')) return;
  initLevelSelect();
  renderHead();

  const p = new URLSearchParams(location.search);
  const lvlKey = p.get('level');
  currentLevel = lvlKey ? levelByKey(lvlKey) : PB_LEVELS[PB_LEVELS.length - 1];
  document.getElementById('levelSelect').value = currentLevel.key;

  document.getElementById('levelSelect').addEventListener('change', onLevelChange);
  document.getElementById('rankHead').addEventListener('click', onHeadClick);

  load();
}

init();