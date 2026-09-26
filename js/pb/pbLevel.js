/**
 * 一个等级的 PB 计算 + 单元格渲染 + 求和/平均用的取值。
 */
class PBLevel {
  constructor({ key, label, minBv, maxBv, stnbC }) {
    this.key = key;
    this.label = label;
    this.minBv = minBv;
    this.maxBv = maxBv;
    this.stnbC = stnbC;
    this.displayMode = 'time';
    this.rankMap = new Map();
    this.defaultTime = { b: 10, i: 60, e: 240 }[key] || 10;
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

  setRankMap(map) {
    this.rankMap = map instanceof Map ? map : new Map();
  }

  getScaleName() {
    switch (this.displayMode) {
      case 'time': return `${this.key}_time`;
      case 'bvs':  return 'bvs';
      case 'stnb': return 'stnb';
      case 'rank': return 'rank';
    }
    return '';
  }

  /* ---------------- 求和/平均取值 ---------------- */

  /**
   * 用于行统计的值。缺失 PB 时使用默认值：
   *   time → defaultTime（b:10 / i:60 / e:240 秒）
   *   bvs / stnb / rank → 0
   * rank 模式取乘法逆（1/rank）。
   */
  getValueForStat(bv, pb) {
    if (!pb) {
      return this.displayMode === 'time' ? this.defaultTime : 0;
    }
    switch (this.displayMode) {
      case 'time': return pb.timems / 1000;
      case 'bvs':  return pb.bv / (pb.timems / 1000);
      case 'stnb': return this.stnbC * pb.bv / Math.pow(pb.timems / 1000, 1.7);
      case 'rank': {
        const r = this.rankMap.get(bv);
        return typeof r === 'number' && r > 0 ? 1 / r : 0;
      }
    }
    return 0;
  }

  /**
   * 用于单元格取色的值。rank 模式下返回 rank 本身（而非 1/rank）。
   * 与 getValueForStat 分离：前者给色阶，后者给求和/加权平均。
   */
  getValueForScale(bv, pb) {
    if (!pb) return null;
    switch (this.displayMode) {
      case 'time': return pb.timems / 1000;
      case 'bvs':  return pb.bv / (pb.timems / 1000);
      case 'stnb': return this.stnbC * pb.bv / Math.pow(pb.timems / 1000, 1.7);
      case 'rank': {
        const r = this.rankMap.get(bv);
        return typeof r === 'number' ? r : null;
      }
    }
    return null;
  }

  /* ---------------- 单元格内容 ---------------- */

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
  renderRank(bv) {
    const r = this.rankMap ? this.rankMap.get(bv) : null;
    const text = typeof r === 'number' ? String(r) : '—';
    return `<span class="pb-rank">${PBFormat.escapeHtml(text)}</span>`;
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

  isInRange(bv) { return bv >= this.minBv && bv <= this.maxBv; }
  getCellClasses() { return ''; }

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
    const style = ColorScale.styleFor(this.getValueForScale(bv, pb), this.getScaleName());
    const styleAttr = style ? ` style="${style}"` : '';
    const cls = `pb-cell pb-has${this.getCellClasses(bv, pb).trim() ? ' ' + this.getCellClasses(bv, pb).trim() : ''}`;
    return `<div class="${cls}"${styleAttr} title="${tip}">${inner}</div>`;
  }

  get maxTens() { return Math.floor(this.maxBv / 10); }
}