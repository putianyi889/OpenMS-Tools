const MedalGridData = (() => {
  // 'level|bv' → Map<rank, records[]>
  let index = null;
  let totalPB = 0;

  async function load() {
    const all = await CacheDB.getAll(CacheDB.STORE_PBS);
    const map = new Map();
    let valid = 0;
    for (const r of all) {
      if (!r || !r.level || r.bv == null || r.rank == null) continue;
      valid++;
      const key = `${r.level}|${r.bv}`;
      let rankMap = map.get(key);
      if (!rankMap) { rankMap = new Map(); map.set(key, rankMap); }
      let arr = rankMap.get(r.rank);
      if (!arr) { arr = []; rankMap.set(r.rank, arr); }
      arr.push(r);
    }
    index = map;
    totalPB = valid;
    return { positions: map.size, pbs: valid };
  }

  function getAtRank(levelKey, bv, rank) {
    if (!index) return [];
    const rankMap = index.get(`${levelKey}|${bv}`);
    if (!rankMap) return [];
    return rankMap.get(rank) || [];
  }

  /** 列出某 rank 下所有 (level, bv) 位置 */
  function positionsAtRank(rank) {
    if (!index) return [];
    const out = [];
    for (const [key, rankMap] of index) {
      if (rankMap.has(rank)) {
        const [level, bv] = key.split('|');
        out.push({ level, bv: Number(bv) });
      }
    }
    return out;
  }

  function hasData() { return index && index.size > 0; }
  function pbCount() { return totalPB; }
  function invalidate() { index = null; totalPB = 0; }

  /**
   * 返回实际存在的、≤ rank 的最大 rank 值；无则返回 null。
   * 用于把空 rank 向下填充到最近的有人档。
   */
  function resolveRank(levelKey, bv, rank) {
    if (!index) return null;
    const rankMap = index.get(`${levelKey}|${bv}`);
    if (!rankMap || !rankMap.size) return null;
    if (rankMap.has(rank)) return rank;

    let maxRank = 0;
    let below = null;
    for (const r of rankMap.keys()) {
      if (r > maxRank) maxRank = r;
      if (r < rank && (below === null || r > below)) below = r;
    }
    // 超出实际最大 rank → 不填充
    if (rank > maxRank) return null;
    return below;
  }

  return { load, getAtRank, resolveRank, positionsAtRank, hasData, pbCount, invalidate };
})();