class PBLevel {
  constructor({ key, label, minBv, maxBv }) {
    this.key = key;
    this.label = label;
    this.minBv = minBv;
    this.maxBv = maxBv;
    this.displayMode = 'time'; // 'time' | 'bvs'
  }

  /* ---------------- 静态工具 ---------------- */

  static formatTime(timems) {
    if (typeof timems !== 'number') return '—';
    return (timems / 1000).toFixed(3);
  }

  /** bvs = bv / time，保留三位小数 */
  static formatBvs(bv, timems) {
    if (typeof timems !== 'number' || timems === 0) return '—';
    const time = timems / 1000;
    return (bv / time).toFixed(3);
  }

  static escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* ---------------- 显示模式 ---------------- */

  setDisplayMode(mode) {
    this.displayMode = mode === 'bvs' ? 'bvs' : 'time';
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

  /**
   * 子类覆写时请保持 (bv, pb) 签名，并根据 this.displayMode 决定呈现。
   */
  getCellText(bv, pb) {
    return this.displayMode === 'bvs'
      ? this.renderBvs(bv, pb)
      : this.renderTime(pb);
  }

  renderTime(pb) {
    const t = PBLevel.formatTime(pb.timems);
    return `<span class="pb-time">${PBLevel.escapeHtml(t)}</span>`;
  }

  renderBvs(bv, pb) {
    const v = PBLevel.formatBvs(bv, pb.timems);
    return `<span class="pb-bvs">${PBLevel.escapeHtml(v)}</span>`;
  }

  renderBadge(text, extraClass = '') {
    return `<span class="pb-badge ${extraClass}">${PBLevel.escapeHtml(text)}</span>`;
  }

  /** tooltip 同时展示两种指标，不受显示模式影响 */
  getCellTooltip(bv, pb) {
    if (!pb) return `bv ${bv} · 无记录`;
    const t = PBLevel.formatTime(pb.timems);
    const b = PBLevel.formatBvs(bv, pb.timems);
    return `bv ${bv}\n玩家: ${pb.player ?? '—'}\n` +
           `time: ${t} s (${pb.timems} ms)\n` +
           `bvs: ${b}\n` +
           `上传: ${pb.upload_time ?? '—'}`;
  }

  /* ---------------- 单元格渲染 ---------------- */

  isInRange(bv) {
    return bv >= this.minBv && bv <= this.maxBv;
  }

  getCellClasses(/* bv, pb */) {
    return '';
  }

  renderCell(bv, pb) {
    if (!this.isInRange(bv)) {
      return `<div class="pb-cell pb-empty"></div>`;
    }

    if (!pb) {
      const tip = PBLevel.escapeHtml(`bv ${bv} · 无记录`);
      return `<div class="pb-cell pb-missing" title="${tip}">—</div>`;
    }

    const inner = this.getCellText(bv, pb);
    const tip = PBLevel.escapeHtml(this.getCellTooltip(bv, pb));
    const extra = this.getCellClasses(bv, pb).trim();
    const cls = `pb-cell pb-has${extra ? ' ' + extra : ''}`;
    return `<div class="${cls}" title="${tip}">${inner}</div>`;
  }

  get maxTens() {
    return Math.floor(this.maxBv / 10);
  }
}