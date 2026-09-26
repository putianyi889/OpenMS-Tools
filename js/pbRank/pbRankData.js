const PBRankData = (() => {
  const COLS = [
    { key: 'sumTime', label: 'Σ time',   dir: 'asc',  scale: 'time' },
    { key: 'avgTime', label: 'x̄ time',   dir: 'asc',  scale: 'time' },
    { key: 'sumBvs',  label: 'Σ bvs',    dir: 'desc', scale: 'bvs'  },
    { key: 'avgBvs',  label: 'x̄ bvs',    dir: 'desc', scale: 'bvs'  },
    { key: 'sumStnb', label: 'Σ stnb',   dir: 'desc', scale: 'stnb' },
    { key: 'avgStnb', label: 'x̄ stnb',   dir: 'desc', scale: 'stnb' },
    { key: 'sumRank', label: 'Σ 1/rank', dir: 'desc', scale: 'rank' },
    { key: 'avgRank', label: 'x̄ 1/rank', dir: 'desc', scale: 'rank' },
    { key: 'pbCount', label: 'PB 数',    dir: 'desc', scale: null   },
  ];

  async function compute(level) {
    const all = await CacheDB.getAll(CacheDB.STORE_PBS);
    const byUser = new Map();
    for (const r of all) {
      if (!r || r.level !== level.key) continue;
      const uid = String(r.userId);
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid).push(r);
    }

    const hasWeights = PBWeights.isConfigured(level.key);
    const rows = [];

    for (const [uid, pbs] of byUser) {
      const pbMap = new Map();
      for (const pb of pbs) pbMap.set(Number(pb.bv), pb);

      let sumTime = 0, sumBvs = 0, sumStnb = 0, sumRank = 0;
      let wsTime = 0, wsBvs = 0, wsStnb = 0, wsRank = 0;
      let wt = 0;
      let pbCount = 0;

      for (let bv = level.minBv; bv <= level.maxBv; bv++) {
        const pb = pbMap.get(bv) || null;
        if (pb) pbCount++;
        const timeSec = pb ? pb.timems / 1000 : level.defaultTime;
        const bvsVal = pb ? pb.bv / (pb.timems / 1000) : 0;
        const stnbVal = pb
          ? level.stnbC * pb.bv / Math.pow(pb.timems / 1000, 1.7)
          : 0;
        const rankInv = pb && typeof pb.rank === 'number' && pb.rank > 0
          ? 1 / pb.rank : 0;

        sumTime += timeSec;
        sumBvs  += bvsVal;
        sumStnb += stnbVal;
        sumRank += rankInv;

        const w = PBWeights.get(level.key, bv);
        wsTime += timeSec * w;
        wsBvs  += bvsVal   * w;
        wsStnb += stnbVal  * w;
        wsRank += rankInv  * w;
        wt += w;
      }

      rows.push({
        userId: uid,
        sumTime, avgTime: wt > 0 ? wsTime / wt : 0,
        sumBvs,  avgBvs:  wt > 0 ? wsBvs  / wt : 0,
        sumStnb, avgStnb: wt > 0 ? wsStnb / wt : 0,
        sumRank, avgRank: wt > 0 ? wsRank / wt : 0,
        pbCount,
      });
    }

    return { rows, hasWeights };
  }

  return { COLS, compute };
})();