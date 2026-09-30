const UserCache = (() => {
  const U = CacheDB.STORE_USERS;
  const S = CacheDB.STORE_SYNC;
  const supported = CacheDB.supported;

  /* ---------------- 同步元数据 ---------------- */

  async function getLastSyncAt() {
    if (!supported) return 0;
    try {
      const meta = await CacheDB.get(S, 'meta');
      return meta ? meta.lastSyncAt || 0 : 0;
    } catch { return 0; }
  }

  async function setLastSyncAt(ts) {
    if (!supported) return;
    await CacheDB.run([S], 'readwrite', t =>
      t.objectStore(S).put({ key: 'meta', lastSyncAt: ts }));
  }

  /* ---------------- 写入 ---------------- */

  function normalize(u) {
    return {
      userId: String(u.id),
      realname:   u.realname ?? null,
      username:   u.username ?? null,
      firstname:  u.firstname ?? null,
      lastname:   u.lastname ?? null,
      signature:  u.signature ?? null,
      country:    u.country ?? null,
      is_banned:  !!u.is_banned,
      is_staff:   !!u.is_staff,
      _raw: u,
    };
  }

  async function putUsers(users) {
    if (!supported || !Array.isArray(users) || !users.length) return 0;
    let n = 0;
    await CacheDB.run([U], 'readwrite', t => {
      const store = t.objectStore(U);
      for (const u of users) {
        if (u == null || u.id == null) continue;
        store.put(normalize(u));
        n++;
      }
    });
    return n;
  }

  /* ---------------- 批量获取 ---------------- */

  async function ensureUsers(userIds, onProgress) {
    if (!supported || !userIds.length) return new Map();
    const result = new Map();
    const missing = [];

    for (const id of userIds) {
      const uid = String(id);
      if (result.has(uid)) continue;
      const cached = await CacheDB.get(U, uid);
      if (cached) result.set(uid, cached);
      else missing.push(uid);
    }

    onProgress && onProgress({
      phase: 'cache', found: result.size, missing: missing.length,
    });

    const BATCH = 50;
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH);
      try {
        const users = await fetchUserInfoBulk(batch);
        await putUsers(users);
        for (const u of users) {
          if (u && u.id != null) result.set(String(u.id), normalize(u));
        }
      } catch (e) {
        console.warn('批量获取用户信息失败', e);
      }
      onProgress && onProgress({
        phase: 'fetch',
        done: Math.min(i + BATCH, missing.length),
        total: missing.length,
      });
    }
    return result;
  }

  /* ---------------- 增量同步 ---------------- */

  async function syncUpdated(onProgress) {
    if (!supported) return { updatedIds: [], fetched: 0 };

    const lastSync = await getLastSyncAt();
    const sinceSec = lastSync ? Math.floor(lastSync / 1000) : 0;
    onProgress && onProgress({ phase: 'check', since: sinceSec });

    const updatedIds = await fetchUserInfoUpdated(sinceSec);
    if (!updatedIds || !updatedIds.length) {
      await setLastSyncAt(Date.now());
      return { updatedIds: [], fetched: 0 };
    }

    onProgress && onProgress({ phase: 'updated', count: updatedIds.length });

    const BATCH = 50;
    let fetched = 0;
    for (let i = 0; i < updatedIds.length; i += BATCH) {
      const batch = updatedIds.slice(i, i + BATCH).map(String);
      try {
        const users = await fetchUserInfoBulk(batch);
        fetched += await putUsers(users);
      } catch (e) {
        console.warn('增量同步批次失败', e);
      }
      onProgress && onProgress({
        phase: 'fetch',
        done: Math.min(i + BATCH, updatedIds.length),
        total: updatedIds.length,
      });
    }

    await setLastSyncAt(Date.now());
    return { updatedIds: updatedIds.map(String), fetched };
  }

  /* ---------------- 查询 ---------------- */

  async function get(userId) {
    if (!supported) return null;
    try { return await CacheDB.get(U, String(userId)); }
    catch { return null; }
  }

  async function getAll() {
    if (!supported) return [];
    try { return await CacheDB.getAll(U); }
    catch { return []; }
  }

  async function count() {
    if (!supported) return 0;
    try { return await CacheDB.count(U); }
    catch { return 0; }
  }

  async function clearAll() {
    if (!supported) return;
    await CacheDB.clearStore(U);
    await CacheDB.clearStore(S);
  }

  return {
    getLastSyncAt, setLastSyncAt, putUsers, ensureUsers, syncUpdated,
    get, getAll, count, clearAll,
  };
})();