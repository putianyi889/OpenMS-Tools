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

/* ---------------- 一键重算全部 ---------------- */

async function recalcEverything() {
  const btn = document.getElementById('recalcAllStart');
  if (!btn || btn.disabled) return;

  const n = await PBCache.count();
  if (!confirm('将依次重算：\n1) PB\n2) 排行\n3) 支撑线\n4) 前端成绩\n\n是否继续？')) return;

  const progressId = 'recalcAllProgress';
  btn.disabled = true;

  try {
    // 阶段 1：重算 PB（清空 rank 和 support）
    renderPhaseText(progressId, '阶段 1/3 · 重算 PB...');
    await new Promise(r => setTimeout(r, 0)); // 让 UI 先刷新一帧
    const r1 = await PBCache.recalcAll(PB_LEVELS, p =>
      renderProgressBar(progressId, {
        done: p.done, total: p.total,
        ok: p.ok, fail: p.fail,
        current: `用户 ${p.current} · PB ${p.totalPB}`,
      })
    );

    // 阶段 2：刷新排行
    renderPhaseText(progressId, '阶段 2/3 · 刷新排行...');
    await new Promise(r => setTimeout(r, 0));
    const r2 = await PBCache.recalcAllRanks(p =>
      renderProgressBar(progressId, {
        done: p.done, total: p.total,
        updated: p.updated,
        current: p.current ? `位置 ${p.current}` : '',
      })
    );

    // 阶段 3：重算支撑线
    renderPhaseText(progressId, '阶段 3/3 · 重算支撑线...');
    await new Promise(r => setTimeout(r, 0));
    const r3 = await recalcAllSupportLines(PB_LEVELS, p =>
      renderProgressBar(progressId, {
        done: p.done, total: p.total,
        updated: p.updated,
        current: `用户 ${p.current}`,
      })
    );

    // 阶段 4：前端成绩
    renderPhaseText(progressId, '阶段 4/4 · 前端成绩...');
    await new Promise(r => setTimeout(r, 0));
    const r4 = await FrontendScores.recalcAll(p =>
      renderProgressBar(progressId, {
        done: p.done, total: p.total,
        ok: p.ok, fail: p.fail,
        current: `用户 ${p.current}`,
      })
    );

    showProgressResult(progressId,
      `✓ 全部完成：PB ${r1.totalPB} 条 · 排行 ${r2.updated} 条 · 支撑线 ${r3.updated} 条`,
      'success');
  } catch (e) {
    console.error(e);
    showProgressResult(progressId, `失败: ${e.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}