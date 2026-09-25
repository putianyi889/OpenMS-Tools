const BatchLoader = (() => {
  const MAX_RANGE = 500;
  let running = false;
  let cancelled = false;

  async function start(from, to, skipCached, onProgress) {
    if (running) throw new Error('已有批量任务在运行');
    running = true;
    cancelled = false;

    const ids = [];
    for (let i = from; i <= to; i++) ids.push(String(i));
    const total = ids.length;

    // 一次性取出已缓存的用户 ID 集合
    const cachedSet = new Set();
    if (skipCached) {
      const cached = await Cache.list();
      cached.forEach(it => cachedSet.add(String(it.userId)));
    }

    let done = 0, ok = 0, fail = 0, skipped = 0;
    for (const id of ids) {
      if (cancelled) break;

      if (skipCached && cachedSet.has(id)) {
        skipped++; done++;
        onProgress({ done, total, current: id, ok, fail, skipped, phase: 'skip' });
        continue;
      }

      onProgress({ done, total, current: id, ok, fail, skipped, phase: 'loading' });
      try {
        const data = await fetchVideos(id); // 走 RequestQueue，自动 ≥1s 间隔
        if (cancelled) break;
        await Cache.write(id, data);
        ok++;
      } catch (e) {
        console.warn(`用户 ${id} 加载失败`, e);
        fail++;
      }
      done++;
      onProgress({ done, total, current: id, ok, fail, skipped, phase: 'done' });
    }

    running = false;
    const finished = !cancelled;
    cancelled = false;
    return { total, done, ok, fail, skipped, finished };
  }

  function cancel() { cancelled = true; }
  function isRunning() { return running; }

  return { start, cancel, isRunning, MAX_RANGE };
})();

/* ---------------- UI 层 ---------------- */

function phaseText(p) {
  return { loading: '请求中', done: '完成', skip: '跳过' }[p] || '';
}

function renderBatchProgress({ done, total, current, ok, fail, skipped, phase }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  document.getElementById('batchProgress').innerHTML = `
    <div class="progress-bar">
      <div class="progress-bar-fill" style="width:${pct}%"></div>
    </div>
    <div class="progress-stats">
      <span>进度 ${done} / ${total}</span>
      <span class="ok">✓ 成功 ${ok}</span>
      <span class="fail">✗ 失败 ${fail}</span>
      <span class="skip">↷ 跳过 ${skipped}</span>
      ${current ? `<span class="current">#${current} · ${phaseText(phase)}</span>` : ''}
    </div>
  `;
}

function showBatchResult(msg, type = '') {
  const el = document.getElementById('batchProgress');
  let div = el.querySelector('.batch-result');
  if (!div) {
    div = document.createElement('div');
    div.className = 'batch-result';
    el.appendChild(div);
  }
  div.textContent = msg;
  div.className = 'batch-result ' + type;
}

async function startBatchLoad() {
  if (BatchLoader.isRunning()) { alert('已有批量任务在运行'); return; }

  const from = parseInt(document.getElementById('batchFrom').value, 10);
  const to = parseInt(document.getElementById('batchTo').value, 10);
  const skipCached = document.getElementById('batchSkipCached').checked;

  if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < from) {
    alert('请输入有效的 ID 范围（起始 ≤ 结束，且 ≥ 1）');
    return;
  }

  const count = to - from + 1;
  if (count > BatchLoader.MAX_RANGE) {
    alert(`范围包含 ${count} 个用户，超过上限 ${BatchLoader.MAX_RANGE}`);
    return;
  }
  if (count > 5) {
    const hint = skipCached ? '（已缓存的将被跳过）' : '';
    if (!confirm(`将请求最多 ${count} 个用户${hint}，\n每两个请求间隔 ≥ 1 秒，是否继续？`)) return;
  }

  const startBtn = document.getElementById('batchStart');
  const cancelBtn = document.getElementById('batchCancel');
  startBtn.disabled = true;
  cancelBtn.disabled = false;

  try {
    const r = await BatchLoader.start(from, to, skipCached, renderBatchProgress);
    showBatchResult(
      r.finished
        ? `✓ 完成：成功 ${r.ok}，失败 ${r.fail}，跳过 ${r.skipped}`
        : `⚠ 已取消：成功 ${r.ok}，失败 ${r.fail}，跳过 ${r.skipped}`,
      r.finished ? 'success' : 'warn'
    );
    if (typeof refreshList === 'function') await refreshList();
  } catch (e) {
    console.error(e);
    showBatchResult(`失败: ${e.message}`, 'error');
  } finally {
    startBtn.disabled = false;
    cancelBtn.disabled = true;
  }
}

function cancelBatchLoad() {
  BatchLoader.cancel();
  showBatchResult('正在取消（当前请求完成后停止）...', 'warn');
}