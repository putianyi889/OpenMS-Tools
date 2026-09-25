/**
 * 一个等级的 PB 计算 + 单元格渲染配置。
 * 未来若需要更高级的计算，可继承本类并覆写 selectPB / getCellText 等方法。
 */
class PBLevel {
  constructor({ key, label, minBv, maxBv }) {
    this.key = key;
    this.label = label;
    this.minBv = minBv;
    this.maxBv = maxBv;
  }

  /** 耗时格式化：timems → 秒，保留三位小数 */
  static formatTime(timems) {
    if (typeof timems !== 'number') return '—';
    return (timems / 1000).toFixed(3);
  }

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

  /**
   * 从桶中选出 PB —— 默认取 timems 最小。
   * 子类可覆写以支持更复杂的评分。
   */
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

  /** 单元格显示文本：time = timems/1000，三位小数 */
  getCellText(pb) {
    return PBLevel.formatTime(pb.timems);
  }

  /** 单元格 tooltip：同样以 time 为主，附原始 timems */
  getCellTooltip(bv, pb) {
    if (!pb) return `bv ${bv} · 无记录`;
    const t = PBLevel.formatTime(pb.timems);
    return `bv ${bv}\n玩家: ${pb.player ?? '—'}\n` +
           `time: ${t} s (${pb.timems} ms)\n` +
           `上传: ${pb.upload_time ?? '—'}`;
  }

  get maxTens() {
    return Math.floor(this.maxBv / 10);
  }
}