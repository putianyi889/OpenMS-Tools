class DuelLevel {
  constructor({ key, label, minBv, maxBv }) {
    this.key = key;
    this.label = label;
    this.minBv = minBv;
    this.maxBv = maxBv;
  }

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

  /**
   * status 取值：
   *  - 'empty'       双方都无
   *  - 'host'        主方击败客方（1 分）
   *  - 'guest'       客方击败主方（1 分）
   *  - 'host_only'   仅主方有 PB（0.25 分，独占）
   *  - 'guest_only'  仅客方有 PB（0.25 分，独占）
   *  - 'both'        双方都有且 timems 相同（各 0.5 分）
   */
  compare(hostPB, guestPB) {
    if (!hostPB && !guestPB) return { status: 'empty', hostScore: 0, guestScore: 0 };
    if (hostPB && !guestPB)  return { status: 'host_only',  hostScore: 0.25, guestScore: 0 };
    if (!hostPB && guestPB)  return { status: 'guest_only', hostScore: 0, guestScore: 0.25 };
    if (hostPB.timems === guestPB.timems)
      return { status: 'both', hostScore: 0.5, guestScore: 0.5 };
    return hostPB.timems < guestPB.timems
      ? { status: 'host',  hostScore: 1, guestScore: 0 }
      : { status: 'guest', hostScore: 0, guestScore: 1 };
  }

  computeDuel(hostVideos, guestVideos) {
    return this._computeFromMaps(
      this.computePBMap(hostVideos),
      this.computePBMap(guestVideos)
    );
  }

  computeDuelFromPBs(hostPBs, guestPBs) {
    return this._computeFromMaps(
      this.indexPBs(hostPBs),
      this.indexPBs(guestPBs)
    );
  }

  _computeFromMaps(hostMap, guestMap) {
    const slots = new Map();
    let hostTotal = 0, guestTotal = 0;
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