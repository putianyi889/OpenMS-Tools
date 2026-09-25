const PBCache = (() => {
  const S = CacheDB.STORE_PBS;
  const L = CacheDB.STORE_LISTS;
  const supported = CacheDB.supported;

  function toRecord(uid, level, bv, pb) {
    return {
      userId: uid, level: level.key, bv,
      videoId: pb.id ?? null, timems: pb.timems ?? null,
      player: pb.player ?? null, upload_time: pb.upload_time ?? null,
      rank: null, // 由 recalcAllRanks 填充
    };
  }

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

  async function recalcAll(levels, onProgress) {
    if (!supported) return { total: 0, ok: 0, fail: 0, totalPB: 0 };
    const lists = await CacheDB.getAll(L);
    let done = 0, ok = 0, fail = 0, totalPB = 0;

    for (const rec of lists) {
      const uid = String(rec.userId);
      try {
        const cached = await Cache.read(uid);
        if (!cached || !Array.isArray(cached.data)) fail++;
        else {
          totalPB += await writeFromVideos(uid, cached.data, levels);
          ok++;
        }
      } catch (e) {
        console.warn(`重算用户 ${uid} 的 PB 失败`, e);
        fail++;
      }
      done++;
      onProgress && onProgress({ done, total: lists.length, current: uid, ok, fail, totalPB });
    }
    return { total: lists.length, ok, fail, totalPB };
  }

  /**
   * 重算所有 PB 在其 (level, bv) 下的排名。
   * 一次 getAll 全量读入 → 内存分组 + 排序 → 批量写回。
   */
  async function recalcAllRanks(onProgress) {
    if (!supported) return { total: 0, updated: 0 };

    const all = await CacheDB.getAll(S);
    const groups = new Map();
    for (const r of all) {
      if (r == null || r.level == null || r.bv == null) continue;
      const key = `${r.level}|${r.bv}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    const total = groups.size;
    const updates = [];
    let done = 0;

    for (const [key, list] of groups) {
      const valid = list
        .filter(r => typeof r.timems === 'number')
        .sort((a, b) => a.timems - b.timems);

      let prevTimems = null, rank = 0;
      for (let i = 0; i < valid.length; i++) {
        const rec = valid[i];
        if (rec.timems !== prevTimems) rank = i + 1;
        prevTimems = rec.timems;
        if (rec.rank !== rank) updates.push({ ...rec, rank });
      }
      done++;
      if (onProgress && (done % 50 === 0 || done === total)) {
        onProgress({ done, total, current: key, updated: updates.length });
      }
    }

    // 分批写回，避免单个事务过大
    const BATCH = 500;
    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH);
      await CacheDB.run([S], 'readwrite', t => {
        const store = t.objectStore(S);
        for (const u of batch) store.put(u);
      });
    }

    onProgress && onProgress({ done: total, total, current: '', updated: updates.length });
    return { total, updated: updates.length };
  }

  return {
    writeFromVideos, getByUser, getByLevelBv, count,
    recalcAll, recalcAllRanks,
  };
})();