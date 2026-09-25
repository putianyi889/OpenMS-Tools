const PBCache = (() => {
  const S = CacheDB.STORE_PBS;
  const L = CacheDB.STORE_LISTS;
  const supported = CacheDB.supported;

  function toRecord(uid, level, bv, pb) {
    return {
      userId: uid, level: level.key, bv,
      videoId: pb.id ?? null, timems: pb.timems ?? null,
      player: pb.player ?? null, upload_time: pb.upload_time ?? null,
    };
  }

  /** 从视频数据计算所有等级的 PB，覆盖写入该用户 */
  async function writeFromVideos(userId, videos, levels) {
    if (!supported || !Array.isArray(videos)) return 0;
    const uid = String(userId);
    const records = [];
    for (const level of levels) {
      const pbMap = level.computePB(videos);
      for (const [bv, pb] of pbMap) records.push(toRecord(uid, level, bv, pb));
    }
    await CacheDB.run([S], 'readwrite', t => {
      const store = t.objectStore(S);
      const idx = store.index('userId');
      const cur = idx.openCursor(IDBKeyRange.only(uid));
      cur.onsuccess = e => {
        const c = e.target.result;
        if (c) { c.delete(); c.continue(); }
      };
      for (const r of records) store.put(r);
    });
    return records.length;
  }

  async function getByUser(userId) {
    if (!supported) return [];
    try { return await CacheDB.getAllByIndex(S, 'userId', String(userId)); }
    catch { return []; }
  }

  async function getByLevelBv(level, bv) {
    if (!supported) return [];
    try { return await CacheDB.getAllByIndex(S, 'level_bv', [level, Number(bv)]); }
    catch { return []; }
  }

  async function count() {
    if (!supported) return 0;
    try { return await CacheDB.run([S], 'readonly', t => t.objectStore(S).count()); }
    catch { return 0; }
  }

  /**
   * 重算所有已缓存用户的 PB。
   * 逐个用户串行：Cache.read → writeFromVideos，不发起网络请求。
   * @param {PBLevel[]} levels
   * @param {(p:Object)=>void} [onProgress]
   * @returns {Promise<{total,ok,fail,totalPB}>}
   */
  async function recalcAll(levels, onProgress) {
    if (!supported) return { total: 0, ok: 0, fail: 0, totalPB: 0 };
    const lists = await CacheDB.getAll(L);
    let done = 0, ok = 0, fail = 0, totalPB = 0;

    for (const rec of lists) {
      const uid = String(rec.userId);
      try {
        const cached = await Cache.read(uid);
        if (!cached || !Array.isArray(cached.data)) {
          fail++;
        } else {
          totalPB += await writeFromVideos(uid, cached.data, levels);
          ok++;
        }
      } catch (e) {
        console.warn(`重算用户 ${uid} 的 PB 失败`, e);
        fail++;
      }
      done++;
      onProgress && onProgress({
        done, total: lists.length, current: uid, ok, fail, totalPB,
      });
    }

    return { total: lists.length, ok, fail, totalPB };
  }

  return { writeFromVideos, getByUser, getByLevelBv, count, recalcAll };
})();