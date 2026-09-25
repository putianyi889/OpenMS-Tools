/**
 * PB 缓存模块。
 * 只负责 PB 的写入与查询，不负责删除（删除由 Cache.remove 统一处理）。
 * 依赖：CacheDB、PBLevel 实例（通过参数传入）。
 */
const PBCache = (() => {
  const S = CacheDB.STORE_PBS;
  const supported = CacheDB.supported;

  /** 把 record 裁剪为规范的存储结构 */
  function toRecord(uid, level, bv, pb) {
    return {
      userId: uid,
      level: level.key,
      bv,
      videoId: pb.id ?? null,
      timems: pb.timems ?? null,
      player: pb.player ?? null,
      upload_time: pb.upload_time ?? null,
    };
  }

  /**
   * 从视频数据计算所有等级的 PB，并覆盖写入该用户的 PB。
   * @returns {Promise<number>} 写入的 PB 条数
   */
  async function writeFromVideos(userId, videos, levels) {
    if (!supported || !Array.isArray(videos)) return 0;
    const uid = String(userId);

    const records = [];
    for (const level of levels) {
      const pbMap = level.computePB(videos);
      for (const [bv, pb] of pbMap) {
        records.push(toRecord(uid, level, bv, pb));
      }
    }

    await CacheDB.run([S], 'readwrite', t => {
      const store = t.objectStore(S);
      // 先删该用户已有 PB
      const idx = store.index('userId');
      const cur = idx.openCursor(IDBKeyRange.only(uid));
      cur.onsuccess = e => {
        const c = e.target.result;
        if (c) { c.delete(); c.continue(); }
      };
      // 再写新记录
      for (const r of records) store.put(r);
    });

    return records.length;
  }

  /** 根据用户查询所有 (level, bv) 的 PB */
  async function getByUser(userId) {
    if (!supported) return [];
    try {
      return await CacheDB.getAllByIndex(S, 'userId', String(userId));
    } catch { return []; }
  }

  /** 根据 (level, bv) 查询所有用户的 PB */
  async function getByLevelBv(level, bv) {
    if (!supported) return [];
    try {
      return await CacheDB.getAllByIndex(S, 'level_bv', [level, Number(bv)]);
    } catch { return []; }
  }

  /** 统计当前 PB 记录总数 */
  async function count() {
    if (!supported) return 0;
    try {
      return await CacheDB.run([S], 'readonly', t => t.objectStore(S).count());
    } catch { return 0; }
  }

  return { writeFromVideos, getByUser, getByLevelBv, count };
})();