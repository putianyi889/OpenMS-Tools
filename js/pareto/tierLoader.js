const TierLoader = (() => {
  const cache = new Map(); // levelKey → 结果

  async function load(levelKey, { force = false, onProgress } = {}) {
    if (!force && cache.has(levelKey)) return cache.get(levelKey);

    const lists = await CacheDB.getAll(CacheDB.STORE_LISTS);
    const userIds = lists.map(r => String(r.userId)).sort();

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

    const { tierOf, subtierOf, subtierLines } =
      TierAlgo.computeTiers(users, { onProgress });

    const groups = new Map();
    for (const [uid, t] of tierOf) {
      const st = subtierOf.get(uid);
      if (!groups.has(t)) groups.set(t, new Map());
      if (!groups.get(t).has(st)) groups.get(t).set(st, []);
      groups.get(t).get(st).push(uid);
    }

    // 拉取参与分档的用户的 realname（缓存命中 + 缺失走 API）
    const userMap = await UserCache.ensureUsers(
      users.map(u => u.userId),
      p => {
        if (p.phase === 'fetch' && p.total) {
          onProgress && onProgress({ phase: 'userinfo', done: p.done, total: p.total });
        }
      }
    );

    const result = {
      groups, subtierLines, pointsByUser, userMap,
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