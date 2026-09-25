/**
 * 一个等级的 PB 计算 + 单元格渲染配置。
 * 显示模式：'time' | 'bvs' | 'stnb' | 'rank'。
 */
class PBLevel {
  constructor({ key, label, minBv, maxBv, stnbC }) {
    this.key = key;
    this.label = label;
    this.minBv = minBv;
    this.maxBv = maxBv;
    this.stnbC = stnbC;
    this.displayMode = 'time';
    this.rankMap = new Map(); // Map<bv, rank>
  }

  static MODES = ['time', 'bvs', 'stnb', 'rank'];

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

  /* ---------------- 显示模式 ---------------- */

  setDisplayMode(mode) {
    this.displayMode = PBLevel.MODES.includes(mode) ? mode : 'time';
  }

  /** 注入本等级下 bv → rank 的映射；传空则清空 */
  setRankMap(map) {
    this.rankMap = map instanceof Map ? map : new Map();
  }

  /* ---------------- 单元格内容片段 ---------------- */

  getCellText(bv, pb) {
    switch (this.displayMode) {
      case 'bvs':  return this.renderBvs(bv, pb);
      case 'stnb': return this.renderStnb(bv, pb);
      case 'rank': return this.renderRank(bv, pb);
      default:     return this.renderTime(pb);
    }
  }

  renderTime(pb) {
    return `<span class="pb-time">${PBFormat.escapeHtml(PBFormat.time(pb.timems))}</span>`;
  }

  renderBvs(bv, pb) {
    return `<span class="pb-bvs">${PBFormat.escapeHtml(PBFormat.bvs(bv, pb.timems))}</span>`;
  }

  renderStnb(bv, pb) {
    const v = PBFormat.stnb(this.stnbC, bv, pb.timems);
    return `<span class="pb-stnb">${PBFormat.escapeHtml(v)}</span>`;
  }

  renderRank(bv /*, pb */) {
    const r = this.rankMap ? this.rankMap.get(bv) : null;
    const text = typeof r === 'number' ? String(r) : '—';
    return `<span class="pb-rank">${PBFormat.escapeHtml(text)}</span>`;
  }

  renderBadge(text, extraClass = '') {
    return `<span class="pb-badge ${extraClass}">${PBFormat.escapeHtml(text)}</span>`;
  }

  getCellTooltip(bv, pb) {
    if (!pb) return `bv ${bv} · 无记录`;
    const t = PBFormat.time(pb.timems);
    const b = PBFormat.bvs(bv, pb.timems);
    const s = PBFormat.stnb(this.stnbC, bv, pb.timems);
    const r = this.rankMap ? this.rankMap.get(bv) : null;
    return `bv ${bv}\n玩家: ${pb.player ?? '—'}\n` +
           `time: ${t} s (${pb.timems} ms)\n` +
           `bvs: ${b}\n` +
           `stnb: ${s}\n` +
           `排名: ${typeof r === 'number' ? r : '未计算'}\n` +
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
      const tip = PBFormat.escapeHtml(`bv ${bv} · 无记录`);
      return `<div class="pb-cell pb-missing" title="${tip}">—</div>`;
    }
    const inner = this.getCellText(bv, pb);
    const tip = PBFormat.escapeHtml(this.getCellTooltip(bv, pb));
    const extra = this.getCellClasses(bv, pb).trim();
    const cls = `pb-cell pb-has${extra ? ' ' + extra : ''}`;
    return `<div class="${cls}" title="${tip}">${inner}</div>`;
  }

  get maxTens() {
    return Math.floor(this.maxBv / 10);
  }
}