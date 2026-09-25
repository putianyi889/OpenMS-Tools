/**
 * 一个等级的互啄计算：每个 bv 位置上，主客双方 PB 的胜负与得分。
 */
class DuelLevel {
  constructor({ key, label, minBv, maxBv }) {
    this.key = key;
    this.label = label;
    this.minBv = minBv;
    this.maxBv = maxBv;
  }

  /** 从一组视频中，计算该等级下每个 bv 的 PB（timems 最小） */
  computePBMap(videos) {
    const key = this.key.toLowerCase();
    const buckets = new Map();
    for (const v of videos) {
      if (!v.level || String(v.level).toLowerCase() !== key) continue;
      const bv = Number(v.bv);
      if (!Number.isFinite(bv) || bv < this.minBv || bv > this.maxBv) continue;
      if (typeof v.timems !== 'number') continue;
      const arr = buckets.get(bv) || [];
      arr.push(v);
      buckets.set(bv, arr);
    }
    const map = new Map();
    for (const [bv, arr] of buckets) {
      let best = arr[0];
      for (const v of arr) if (v.timems < best.timems) best = v;
      map.set(bv, best);
    }
    return map;
  }

  /** 比较一个位置：返回 { status, hostScore, guestScore } */
  compare(hostPB, guestPB) {
    if (!hostPB && !guestPB) return { status: 'empty', hostScore: 0, guestScore: 0 };
    if (hostPB && !guestPB)  return { status: 'host',  hostScore: 0.25, guestScore: 0 };
    if (!hostPB && guestPB)  return { status: 'guest', hostScore: 0, guestScore: 0.25 };
    if (hostPB.timems === guestPB.timems)
      return { status: 'both', hostScore: 0.5, guestScore: 0.5 };
    return hostPB.timems < guestPB.timems
      ? { status: 'host',  hostScore: 1, guestScore: 0 }
      : { status: 'guest', hostScore: 0, guestScore: 1 };
  }

  /** 计算该等级的完整互啄结果 */
  computeDuel(hostVideos, guestVideos) {
    const hostMap = this.computePBMap(hostVideos);
    const guestMap = this.computePBMap(guestVideos);
    const slots = new Map();
    let hostTotal = 0;
    let guestTotal = 0;

    for (let bv = this.minBv; bv <= this.maxBv; bv++) {
      const h = hostMap.get(bv) || null;
      const g = guestMap.get(bv) || null;
      const cmp = this.compare(h, g);
      slots.set(bv, { bv, hostPB: h, guestPB: g, ...cmp });
      hostTotal += cmp.hostScore;
      guestTotal += cmp.guestScore;
    }
    return { slots, hostTotal, guestTotal };
  }

  /** 有任意一方占领的十位范围，仅用于裁剪首尾空行 */
  computeRowRange(slots) {
    let minTens = Infinity;
    let maxTens = -Infinity;
    for (const s of slots.values()) {
      if (s.status === 'empty') continue;
      const tens = Math.floor(s.bv / 10);
      if (tens < minTens) minTens = tens;
      if (tens > maxTens) maxTens = tens;
    }
    return minTens === Infinity ? null : [minTens, maxTens];
  }
}