/* ---------------- 重算 PB 值 ---------------- */

async function recalcAllPBs() {
  const btn = document.getElementById('recalcStart');
  if (!btn || btn.disabled) return;

  const lists = await Cache.list();
  if (!lists.length) { showRecalcResult('recalcProgress', '没有已缓存的用户', 'warn'); return; }
  if (!confirm(`将重算 ${lists.length} 个用户的 PB，是否继续？`)) return;

  btn.disabled = true;
  try {
    const r = await PBCache.recalcAll(PB_LEVELS, p => renderProgress('recalcProgress', p));
    showRecalcResult('recalcProgress',
      `✓ 完成：成功 ${r.ok}，失败 ${r.fail}，共写入 ${r.totalPB} 条 PB`, 'success');
    if (typeof refreshList === 'function') await refreshList();
  } catch (e) {
    console.error(e);
    showRecalcResult('recalcProgress', `失败: ${e.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}

/* ---------------- 刷新排行 ---------------- */

async function recalcAllRanksUI() {
  const btn = document.getElementById('recalcRanksStart');
  if (!btn || btn.disabled) return;

  const n = await PBCache.count();
  if (!n) { showRecalcResult('rankProgress', '没有 PB 记录可重算', 'warn'); return; }
  if (!confirm(`将重算 ${n} 条 PB 的排名，是否继续？`)) return;

  btn.disabled = true;
  try {
    const r = await PBCache.recalcAllRanks(p => renderProgress('rankProgress', p));
    showRecalcResult('rankProgress',
      `✓ 完成：处理 ${r.total} 个 (level, bv)，更新 ${r.updated} 条记录`, 'success');
  } catch (e) {
    console.error(e);
    showRecalcResult('rankProgress', `失败: ${e.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}

/* ---------------- 共享 UI ---------------- */

function renderProgress(targetId, { done, total, current, ok, fail, updated }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  const parts = [
    `<span>进度 ${done} / ${total}</span>`,
    ok != null      ? `<span class="ok">✓ 成功 ${ok}</span>` : '',
    fail != null    ? `<span class="fail">✗ 失败 ${fail}</span>` : '',
    updated != null ? `<span>更新 ${updated}</span>` : '',
    current         ? `<span class="current">${current}</span>` : '',
  ].filter(Boolean).join('');
  document.getElementById(targetId).innerHTML = `
    <div class="progress-bar">
      <div class="progress-bar-fill" style="width:${pct}%"></div>
    </div>
    <div class="progress-stats">${parts}</div>
  `;
}

function showRecalcResult(targetId, msg, type = '') {
  const el = document.getElementById(targetId);
  let div = el.querySelector('.batch-result');
  if (!div) {
    div = document.createElement('div');
    div.className = 'batch-result';
    el.appendChild(div);
  }
  div.textContent = msg;
  div.className = 'batch-result ' + type;
}