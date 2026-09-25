class DuelLevel {
  constructor({ key, label, minBv, maxBv }) {
    this.key = key;
    this.label = label;
    this.minBv = minBv;
    this.maxBv = maxBv;
  }

  /** 从视频中计算每个 bv 的 PB（timems 最小），返回 Map<bv, video> */
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

  /** 从已缓存的 PB 记录里筛出属于本等级、本范围的项，返回 Map<bv, record> */
  indexPBs(pbs) {
    const map = new Map();
    for (const r of pbs) {
      if (!r || r.level !== this.key) continue;
      const bv = Number(r.bv);
      if (!Number.isFinite(bv) || bv < this.minBv || bv > this.maxBv) continue;
      map.set(bv, r);
    }
    return map;
  }

  /** 比较一个位置，返回 { status, hostScore, guestScore } */
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

  /** 从原始视频计算（保留，兼容旧调用） */
  computeDuel(hostVideos, guestVideos) {
    return this._computeFromMaps(
      this.computePBMap(hostVideos),
      this.computePBMap(guestVideos)
    );
  }

  /** 从已缓存的 PB 记录计算（新） */
  computeDuelFromPBs(hostPBs, guestPBs) {
    return this._computeFromMaps(
      this.indexPBs(hostPBs),
      this.indexPBs(guestPBs)
    );
  }

  _computeFromMaps(hostMap, guestMap) {
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

  computeRowRange(slots) {
    let minTens = Infinity, maxTens = -Infinity;
    for (const s of slots.values()) {
      if (s.status === 'empty') continue;
      const tens = Math.floor(s.bv / 10);
      if (tens < minTens) minTens = tens;
      if (tens > maxTens) maxTens = tens;
    }
    return minTens === Infinity ? null : [minTens, maxTens];
  }
}