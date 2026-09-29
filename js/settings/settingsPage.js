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

  const old = FrontendScores.getTopN();
  FrontendScores.setTopN(v);

  if (old === v) {
    status.textContent = '未变化';
    status.className = 'status';
    return;
  }

  status.textContent = '重算中...';
  status.className = 'status';
  try {
    const r = await FrontendScores.recalcAll();
    status.textContent = `✓ 完成，已更新 ${r.ok} 个用户` + (r.fail ? ` · 失败 ${r.fail}` : '');
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