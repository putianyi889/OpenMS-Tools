/** PB 三种指标的格式化工具。time = timems/1000，均保留三位小数。 */
const PBFormat = {
  time(timems) {
    if (typeof timems !== 'number') return '—';
    return (timems / 1000).toFixed(3);
  },

  bvs(bv, timems) {
    if (typeof timems !== 'number' || timems === 0) return '—';
    return (bv / (timems / 1000)).toFixed(3);
  },

  /** STNB = c * bv / time^1.7 */
  stnb(c, bv, timems) {
    if (typeof timems !== 'number' || timems <= 0) return '—';
    const time = timems / 1000;
    return (c * bv / Math.pow(time, 1.7)).toFixed(3);
  },

  escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  },
};