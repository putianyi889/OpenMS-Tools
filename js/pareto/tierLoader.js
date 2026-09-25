const TierLoader = (() => {
  const cache = new Map(); // levelKey → 结果

  async function load(levelKey, { force = false, onProgress } = {}) {
    if (!force && cache.has(levelKey)) return cache.get(levelKey);

    // 1. 列出所有已缓存用户
    const lists = await CacheDB.getAll(CacheDB.STORE_LISTS);
    const userIds = lists.map(r => String(r.userId)).sort();

    // 2. 逐用户读支撑线
    const users = [];
    const pointsByUser = new Map();
    let done = 0;
    for (const uid of userIds) {
      const points = await PBCache.getSupportLine(uid, levelKey);
      if (points.length) {
        users.push({ userId: uid, points });
        pointsByUser.set(uid, points);
      }
      done++;
      if (onProgress && (done % 10 === 0 || done === userIds.length)) {
        onProgress({ phase: 'load', done, total: userIds.length });
      }
    }

    // 3. 计算
    const { tierOf, subtierOf, subtierLines } =
      TierAlgo.computeTiers(users, { onProgress });

    // 4. 组织为 Map<tier, Map<subtier, userIds[]>>
    const groups = new Map();
    for (const [uid, t] of tierOf) {
      const st = subtierOf.get(uid);
      if (!groups.has(t)) groups.set(t, new Map());
      if (!groups.get(t).has(st)) groups.get(t).set(st, []);
      groups.get(t).get(st).push(uid);
    }

    const result = {
      groups, subtierLines, pointsByUser,
      totalUsers: users.length,
      ts: Date.now(),
    };
    cache.set(levelKey, result);
    return result;
  }

  function invalidate(levelKey) {
    if (levelKey) cache.delete(levelKey); else cache.clear();
  }

  return { load, invalidate };
})();