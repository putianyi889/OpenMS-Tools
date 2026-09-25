const Utils = {
  palette(n) {
    const base = ['#58a6ff','#bc8cff','#3fb950','#d29922','#f85149',
                  '#79c0ff','#d2a8ff','#56d364','#e3b341','#ff7b72',
                  '#a5d6ff','#e0c3ff','#7ee787','#f0c674','#ffa198'];
    return Array.from({ length: n }, (_, i) => base[i % base.length]);
  },

  fmtDate(iso) {
    if (!iso) return '—';
    return iso.slice(0, 10);
  },

  fmtDateTime(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ` +
             `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return iso; }
  },

  setStatus(msg, type) {
    const el = document.getElementById('status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'status' + (type ? ' ' + type : '');
  },

  getUserId() {
    return new URLSearchParams(location.search).get('user_id');
  },

  setupRefreshLink() {
    const link = document.getElementById('refreshLink');
    if (!link) return;
    const userId = this.getUserId();
    if (userId) link.href = `?user_id=${userId}&refresh=1`;
  },

  chart(canvasId, type, data, options, store) {
    if (store[canvasId]) store[canvasId].destroy();
    const ctx = document.getElementById(canvasId).getContext('2d');
    store[canvasId] = new Chart(ctx, {
      type, data,
      options: { responsive: true, maintainAspectRatio: true, ...options }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Utils.setupRefreshLink();
});