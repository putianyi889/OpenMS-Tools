let currentLevel = null;
let currentBv = null;

function levelByKey(key) {
  return PB_LEVELS.find(l => l.key === key) || PB_LEVELS[0];
}

function initLevelSelect() {
  const sel = document.getElementById('levelSelect');
  sel.innerHTML = '';
  for (const lv of PB_LEVELS) {
    const opt = document.createElement('option');
    opt.value = lv.key;
    opt.textContent = `${lv.label} 级 (bv ${lv.minBv}–${lv.maxBv})`;
    sel.appendChild(opt);
  }
}

function fillBvSelect(level, selectedBv) {
  const sel = document.getElementById('bvSelect');
  sel.innerHTML = '';
  for (let bv = level.minBv; bv <= level.maxBv; bv++) {
    const opt = document.createElement('option');
    opt.value = bv;
    opt.textContent = bv;
    if (bv === Number(selectedBv)) opt.selected = true;
    sel.appendChild(opt);
  }
}

function readUrl() {
  const p = new URLSearchParams(location.search);
  const lv = levelByKey(p.get('level') || PB_LEVELS[0].key);
  let bv = Number(p.get('bv'));
  if (!Number.isFinite(bv) || bv < lv.minBv || bv > lv.maxBv) bv = lv.minBv;
  return { level: lv, bv };
}

function writeUrl(levelKey, bv) {
  const p = new URLSearchParams(location.search);
  p.set('level', levelKey);
  p.set('bv', bv);
  history.replaceState(null, '', location.pathname + '?' + p.toString());
}

async function query() {
  const level = currentLevel;
  const bv = Number(currentBv);
  Utils.setStatus('查询中...');
  try {
    const records = await PBCache.getByLevelBv(level.key, bv);
    const valid = records
      .filter(r => r && typeof r.timems === 'number')
      .sort((a, b) => a.timems - b.timems);
    MedalsRenderer.render(valid, level);
    Utils.setStatus(
      valid.length ? `共 ${valid.length} 位用户的 PB` : '该位置暂无缓存的 PB',
      valid.length ? 'success' : ''
    );
  } catch (e) {
    console.error(e);
    Utils.setStatus(`查询失败: ${e.message}`, 'error');
  }
}

function onLevelChange() {
  const level = levelByKey(document.getElementById('levelSelect').value);
  currentLevel = level;
  // 保持旧 bv；若超出新等级范围，则重置为 minBv
  let bv = Number(currentBv);
  if (!Number.isFinite(bv) || bv < level.minBv || bv > level.maxBv) {
    bv = level.minBv;
  }
  currentBv = bv;
  fillBvSelect(level, bv);
  writeUrl(level.key, bv);
  query();
}

function onBvChange() {
  currentBv = Number(document.getElementById('bvSelect').value);
  writeUrl(currentLevel.key, currentBv);
  query();
}

function initMedalsPage() {
  if (!document.getElementById('medalTable')) return;
  initLevelSelect();

  const { level, bv } = readUrl();
  currentLevel = level;
  currentBv = bv;
  document.getElementById('levelSelect').value = level.key;
  fillBvSelect(level, bv);
  writeUrl(level.key, bv);

  document.getElementById('levelSelect').addEventListener('change', onLevelChange);
  document.getElementById('bvSelect').addEventListener('change', onBvChange);

  query();
}

initMedalsPage();