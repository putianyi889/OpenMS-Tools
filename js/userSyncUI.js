async function syncUserInfo() {
  const btn = document.getElementById('userSyncStart');
  if (!btn || btn.disabled) return;

  const metaEl = document.getElementById('userSyncMeta');
  const progressId = 'userSyncProgress';

  const lastSync = await UserCache.getLastSyncAt();
  if (metaEl) {
    metaEl.textContent = lastSync
      ? `上次同步: ${Utils.fmtDateTime(new Date(lastSync).toISOString())}`
      : '从未同步';
  }

  btn.disabled = true;
  renderProgressBar(progressId, { done: 0, total: 0 });

  try {
    const r = await UserCache.syncUpdated(p => {
      if (p.phase === 'check') {
        renderPhaseText(progressId, '检查更新中...');
      } else if (p.phase === 'updated') {
        renderPhaseText(progressId, `发现 ${p.count} 个更新`);
      } else if (p.phase === 'fetch') {
        renderProgressBar(progressId, { done: p.done, total: p.total });
      }
    });
    showProgressResult(progressId,
      `✓ 同步完成：更新 ${r.updatedIds.length} 个用户，写入 ${r.fetched} 条`,
      'success');
  } catch (e) {
    console.error(e);
    showProgressResult(progressId, `失败: ${e.message}`, 'error');
  } finally {
    btn.disabled = false;
    if (metaEl) {
      const t = await UserCache.getLastSyncAt();
      if (t) metaEl.textContent =
        `上次同步: ${Utils.fmtDateTime(new Date(t).toISOString())}`;
    }
  }
}