/** 进度条 + 结果提示的公共 UI 组件。 */

function renderProgressBar(targetId, { done, total, current, ok, fail, updated }) {
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

function showProgressResult(targetId, msg, type = '') {
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

/** 通用：把 loader 各 phase 映射为一行文案 */
function renderPhaseText(targetId, text) {
  const el = document.getElementById(targetId);
  if (el) el.innerHTML = `<div class="progress-stats"><span>${text}</span></div>`;
}