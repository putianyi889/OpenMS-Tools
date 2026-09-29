function updateInfo(levelKey) {
  const el = document.getElementById(`info-${levelKey}`);
  if (!el) return;
  const s = PBWeights.summary(levelKey);
  if (!s) {
    el.textContent = '当前：未配置';
    el.classList.remove('ok');
    return;
  }
  el.textContent =
    `当前：长度 ${s.length} · 非零项 ${s.nonZero} · 总和 ${s.sum.toFixed(4)}（仅供参考）`;
  el.classList.add('ok');
}

function loadCurrent(levelKey) {
  const arr = PBWeights.getArray(levelKey);
  const ta = document.getElementById(`weight-${levelKey}`);
  if (arr && ta) ta.value = JSON.stringify(arr);
}

function saveWeights(levelKey) {
  const ta = document.getElementById(`weight-${levelKey}`);
  const status = document.getElementById(`status-${levelKey}`);
  const input = ta.value.trim();
  if (!input) {
    status.textContent = '请输入 JSON';
    status.className = 'status error';
    return;
  }
  try {
    PBWeights.setFromJson(levelKey, input);
    status.textContent = '✓ 已保存';
    status.className = 'status success';
    updateInfo(levelKey);
  } catch (e) {
    status.textContent = '保存失败: ' + e.message;
    status.className = 'status error';
  }
}

function clearWeights(levelKey) {
  const label = levelKey.toUpperCase();
  if (!confirm(`确定清空 ${label} 级的权重配置？`)) return;
  PBWeights.clear(levelKey);
  document.getElementById(`weight-${levelKey}`).value = '';
  const status = document.getElementById(`status-${levelKey}`);
  status.textContent = '已清空';
  status.className = 'status';
  updateInfo(levelKey);
}

if (document.getElementById('weight-b')) {
  for (const k of PBWeights.LEVELS) {
    loadCurrent(k);
    updateInfo(k);
  }
}

async function saveTopN() {
  const input = document.getElementById('topNInput');
  const status = document.getElementById('topNStatus');
  const v = parseInt(input.value, 10);
  if (!Number.isFinite(v) || v < 1 || v > FrontendScores.MAX_TOPN) {
    status.textContent = `请输入 1-${FrontendScores.MAX_TOPN} 之间的整数`;
    status.className = 'status error';
    return;
  }

  FrontendScores.setTopN(v);
  status.textContent = '重算中...';
  status.className = 'status';
  try {
    const r = await FrontendScores.recalcAll();  // 内部已含 NT 重算
    status.textContent =
      `✓ 完成，已更新 ${r.ok} 个用户` + (r.fail ? ` · 失败 ${r.fail}` : '');
    status.className = 'status success';
  } catch (e) {
    status.textContent = `失败: ${e.message}`;
    status.className = 'status error';
  }
}

function initTopNInput() {
  const input = document.getElementById('topNInput');
  if (input) input.value = FrontendScores.getTopN();
}

if (document.getElementById('topNInput')) {
  initTopNInput();
}

function fillSoftWeights(w) {
  for (const lv of ['b', 'i', 'e']) {
    for (const m of ['t', 'b', 's']) {
      const el = document.getElementById(`w-${lv}-${m}`);
      if (el) el.value = w[lv][m];
    }
  }
}

function readSoftWeights() {
  const w = {};
  for (const lv of ['b', 'i', 'e']) {
    w[lv] = {};
    for (const m of ['t', 'b', 's']) {
      const el = document.getElementById(`w-${lv}-${m}`);
      const v = parseFloat(el.value);
      if (!Number.isFinite(v) || v < 0) {
        throw new Error(`${lv}.${m} 无效`);
      }
      w[lv][m] = v;
    }
  }
  return w;
}

function saveSoftWeights() {
  const status = document.getElementById('softWeightStatus');
  try {
    const w = readSoftWeights();
    SoftPower.setWeights(w);
    status.textContent = '✓ 已保存';
    status.className = 'status success';
  } catch (e) {
    status.textContent = '保存失败: ' + e.message;
    status.className = 'status error';
  }
}

function resetSoftWeights() {
  if (!confirm('恢复默认软实力权重？')) return;
  SoftPower.clearWeights();
  fillSoftWeights(SoftPower.getWeights());
  const status = document.getElementById('softWeightStatus');
  status.textContent = '已恢复默认';
  status.className = 'status';
}

if (document.getElementById('w-b-t')) {
  fillSoftWeights(SoftPower.getWeights());
}

/* ---------------- NT 前 N 名 ---------------- */

function updateNTPreview() {
  const el = document.getElementById('ntPreview');
  if (!el) return;
  const nt = FrontendNT.get();
  if (!nt) {
    el.textContent = '当前：未生成 NT（请先重算前端成绩）';
    el.classList.remove('ok');
    return;
  }
  const sample = ['bt', 'bb', 'bs']
    .map(k => `${k}=${nt[k] != null ? nt[k].toFixed(3) : '—'}`)
    .join(' · ');
  el.textContent = `当前：${sample} · … · 前 ${FrontendNT.getN()} 名`;
  el.classList.add('ok');
}

async function saveNTN() {
  const input = document.getElementById('ntNInput');
  const status = document.getElementById('ntNStatus');
  const v = parseInt(input.value, 10);

  if (!Number.isFinite(v) || v < 1 || v > FrontendNT.MAX_N) {
    status.textContent = `请输入 1-${FrontendNT.MAX_N} 之间的整数`;
    status.className = 'status error';
    return;
  }

  FrontendNT.setN(v);
  status.textContent = '重算中...';
  status.className = 'status';
  try {
    const rows = await FrontendScores.getAll();
    if (!rows.length) {
      status.textContent = '无前端成绩缓存，无法重算';
      status.className = 'status error';
      return;
    }
    FrontendNT.computeAndSave(rows);
    status.textContent = `✓ 已重算（基于 ${rows.length} 位用户）`;
    status.className = 'status success';
    updateNTPreview();
  } catch (e) {
    status.textContent = `失败: ${e.message}`;
    status.className = 'status error';
  }
}

function initNTInput() {
  const input = document.getElementById('ntNInput');
  if (!input) return;
  input.value = FrontendNT.getN();
  updateNTPreview();
}

if (document.getElementById('ntNInput')) {
  initNTInput();
}