async function recalcAllPBs() {
  const btn = document.getElementById('recalcStart');
  if (!btn || btn.disabled) return;

  const lists = await Cache.list();
  if (!lists.length) {
    showRecalcResult('没有已缓存的用户', 'warn');
    return;
  }
  if (!confirm(`将重算 ${lists.length} 个用户的 PB，是否继续？`)) return;

  btn.disabled = true;
  try {
    const r = await PBCache.recalcAll(PB_LEVELS, renderRecalcProgress);
    showRecalcResult(
      `✓ 完成：成功 ${r.ok}，失败 ${r.fail}，共写入 ${r.totalPB} 条 PB`,
      'success'
    );
    if (typeof refreshList === 'function') await refreshList();
  } catch (e) {
    console.error(e);
    showRecalcResult(`失败: ${e.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}

function renderRecalcProgress({ done, total, current, ok, fail, totalPB }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  document.getElementById('recalcProgress').innerHTML = `
    <div class="progress-bar">
      <div class="progress-bar-fill" style="width:${pct}%"></div>
    </div>
    <div class="progress-stats">
      <span>进度 ${done} / ${total}</span>
      <span class="ok">✓ 成功 ${ok}</span>
      <span class="fail">✗ 失败 ${fail}</span>
      <span>PB ${totalPB}</span>
      ${current ? `<span class="current">#${current}</span>` : ''}
    </div>
  `;
}

function showRecalcResult(msg, type = '') {
  const el = document.getElementById('recalcProgress');
  let div = el.querySelector('.batch-result');
  if (!div) {
    div = document.createElement('div');
    div.className = 'batch-result';
    el.appendChild(div);
  }
  div.textContent = msg;
  div.className = 'batch-result ' + type;
}