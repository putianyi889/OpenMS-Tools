/* ---------------- 重算 PB 值 ---------------- */

async function recalcAllPBs() {
  const btn = document.getElementById('recalcStart');
  if (!btn || btn.disabled) return;

  const lists = await Cache.list();
  if (!lists.length) { showProgressResult('recalcProgress', '没有已缓存的用户', 'warn'); return; }
  if (!confirm(`将重算 ${lists.length} 个用户的 PB，是否继续？`)) return;

  btn.disabled = true;
  try {
    const r = await PBCache.recalcAll(PB_LEVELS, p => renderProgressBar('recalcProgress', p));
    showProgressResult('recalcProgress',
      `✓ 完成：成功 ${r.ok}，失败 ${r.fail}，共写入 ${r.totalPB} 条 PB`, 'success');
    if (typeof refreshList === 'function') await refreshList();
  } catch (e) {
    console.error(e);
    showProgressResult('recalcProgress', `失败: ${e.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}

/* ---------------- 刷新排行 ---------------- */

async function recalcAllRanksUI() {
  const btn = document.getElementById('recalcRanksStart');
  if (!btn || btn.disabled) return;

  const n = await PBCache.count();
  if (!n) { showProgressResult('rankProgress', '没有 PB 记录可重算', 'warn'); return; }
  if (!confirm(`将重算 ${n} 条 PB 的排名，是否继续？`)) return;

  btn.disabled = true;
  try {
    const r = await PBCache.recalcAllRanks(p => renderProgressBar('rankProgress', p));
    showProgressResult('rankProgress',
      `✓ 完成：处理 ${r.total} 个 (level, bv)，更新 ${r.updated} 条记录`, 'success');
  } catch (e) {
    console.error(e);
    showProgressResult('rankProgress', `失败: ${e.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}

/* ---------------- 共享 UI ---------------- */

async function recalcSupportLinesUI() {
  const btn = document.getElementById('recalcSupportStart');
  if (!btn || btn.disabled) return;
  const n = await PBCache.count();
  if (!n) { showProgressResult('supportProgress', '没有 PB 记录可重算', 'warn'); return; }
  if (!confirm(`将重算所有用户的支撑线（共 ${n} 条 PB），是否继续？`)) return;
  btn.disabled = true;
  try {
    const r = await recalcAllSupportLines(PB_LEVELS, p => renderProgressBar('supportProgress', p));
    showProgressResult('supportProgress',
      `✓ 完成：处理 ${r.total} 个用户，更新 ${r.updated} 条记录`, 'success');
  } catch (e) {
    console.error(e);
    showProgressResult('supportProgress', `失败: ${e.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}