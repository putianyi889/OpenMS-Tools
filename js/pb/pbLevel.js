/**
 * 一个等级的 PB 计算 + 单元格渲染配置。
 * 未来若需要更高级的计算，可继承本类并覆写 selectPB / getCellText / renderCell 等方法。
 */
class PBLevel {
  constructor({ key, label, minBv, maxBv }) {
    this.key = key;
    this.label = label;
    this.minBv = minBv;
    this.maxBv = maxBv;
  }

  /* ---------------- 静态工具 ---------------- */

  static formatTime(timems) {
    if (typeof timems !== 'number') return '—';
    return (timems / 1000).toFixed(3);
  }

  static escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* ---------------- 计算 ---------------- */

  filterVideos(videos) {
    const key = this.key.toLowerCase();
    return videos.filter(v => {
      if (!v.level || String(v.level).toLowerCase() !== key) return false;
      const bv = Number(v.bv);
      return Number.isFinite(bv) && bv >= this.minBv && bv <= this.maxBv;
    });
  }

  groupByBucket(videos) {
    const map = new Map();
    for (const v of videos) {
      const bv = Number(v.bv);
      const arr = map.get(bv) || [];
      arr.push(v);
      map.set(bv, arr);
    }
    return map;
  }

  selectPB(bucketVideos) {
    let best = null;
    for (const v of bucketVideos) {
      if (typeof v.timems !== 'number') continue;
      if (best === null || v.timems < best.timems) best = v;
    }
    return best;
  }

  computePB(videos) {
    const buckets = this.groupByBucket(this.filterVideos(videos));
    const pbMap = new Map();
    for (const [bv, arr] of buckets) {
      const pb = this.selectPB(arr);
      if (pb) pbMap.set(bv, pb);
    }
    return pbMap;
  }

  /* ---------------- 单元格内容片段 ---------------- */

  getCellText(pb) {
    return this.renderTime(pb);
  }

  renderTime(pb) {
    const t = PBLevel.formatTime(pb.timems);
    return `<span class="pb-time">${PBLevel.escapeHtml(t)}</span>`;
  }

  renderBadge(text, extraClass = '') {
    return `<span class="pb-badge ${extraClass}">${PBLevel.escapeHtml(text)}</span>`;
  }

  getCellTooltip(bv, pb) {
    if (!pb) return `bv ${bv} · 无记录`;
    const t = PBLevel.formatTime(pb.timems);
    return `bv ${bv}\n玩家: ${pb.player ?? '—'}\n` +
           `time: ${t} s (${pb.timems} ms)\n` +
           `上传: ${pb.upload_time ?? '—'}`;
  }

  /* ---------------- 单元格渲染 ---------------- */

  isInRange(bv) {
    return bv >= this.minBv && bv <= this.maxBv;
  }

  /**
   * 子类可覆写以给单元格追加类名（例如命中特效、置顶标记）。
   * @returns {string} 附加类名，空格分隔；返回空字符串则不加
   */
  getCellClasses(/* bv, pb */) {
    return '';
  }

  /** 完整渲染一个单元格；默认实现覆盖「范围外 / 无记录 / 有 PB」三种情况 */
  renderCell(bv, pb) {
    if (!this.isInRange(bv)) {
      return `<div class="pb-cell pb-empty"></div>`;
    }

    if (!pb) {
      const tip = PBLevel.escapeHtml(`bv ${bv} · 无记录`);
      return `<div class="pb-cell pb-missing" title="${tip}">—</div>`;
    }

    const inner = this.getCellText(pb);
    const tip = PBLevel.escapeHtml(this.getCellTooltip(bv, pb));
    const extra = this.getCellClasses(bv, pb).trim();
    const cls = `pb-cell pb-has${extra ? ' ' + extra : ''}`;
    return `<div class="${cls}" title="${tip}">${inner}</div>`;
  }

  get maxTens() {
    return Math.floor(this.maxBv / 10);
  }
}