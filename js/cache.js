const Cache = (() => {
  const V = CacheDB.STORE_VIDEOS;
  const L = CacheDB.STORE_LISTS;
  const P = CacheDB.STORE_PBS;
  const F = 'frontend_scores';
  const supported = CacheDB.supported;

  /** 尝试多种 key 类型拿到该用户的所有视频 */
  async function fetchAllUserVideos(uid) {
    let all = await CacheDB.getAllByIndex(V, 'userId', uid).catch(() => []);
    if (all.length) return all;

    const uidNum = Number(uid);
    if (Number.isFinite(uidNum)) {
      all = await CacheDB.getAllByIndex(V, 'userId', uidNum).catch(() => []);
      if (all.length) return all;
    }

    const everything = await CacheDB.getAll(V).catch(() => []);
    return everything.filter(v => v && String(v.userId) === uid);
  }

  async function read(userId) {
    if (!supported) return null;
    try {
      const uid = String(userId);
      const rec = await CacheDB.get(L, uid);
      if (!rec) return null;

      const ids = (rec.videoIds || []).filter(id => id != null);
      if (!ids.length) {
        return { data: [], ts: rec.ts, age: Date.now() - rec.ts };
      }

      const all = await fetchAllUserVideos(uid);
      const vmap = new Map();
      for (const v of all) {
        if (v != null && v.id != null) vmap.set(String(v.id), v);
      }

      const seen = new Set();
      const data = [];
      for (const id of ids) {
        const key = String(id);
        const v = vmap.get(key);
        if (v) { data.push(v); seen.add(key); }
      }
      for (const v of all) {
        const key = String(v.id);
        if (!seen.has(key)) data.push(v);
      }

      return { data, ts: rec.ts, age: Date.now() - rec.ts };
    } catch (e) {
      console.warn('缓存读取失败', e);
      return null;
    }
  }

  async function write(userId, videos) {
    if (!supported || !Array.isArray(videos)) return false;
    try {
      await CacheDB.run([L, V], 'readwrite', t => {
        const vstore = t.objectStore(V);
        const uid = String(userId);
        const ids = [];
        for (const v of videos) {
          if (v == null || v.id == null) continue;
          ids.push(v.id);
          vstore.put({ ...v, userId: uid });
        }
        t.objectStore(L).put({ userId: uid, videoIds: ids, ts: Date.now() });
      });
      return true;
    } catch (e) {
      console.warn('缓存写入失败', e);
      return false;
    }
  }

  /** 删除某用户：视频 + 列表 + PB + 前端成绩 一并清理 */
  async function remove(userId) {
    if (!supported) return;
    try {
      const uid = String(userId);
      await CacheDB.run([L, V, P, F], 'readwrite', t => {
        // 1. 删除 video_lists 记录
        t.objectStore(L).delete(uid);

        // 2. 走 userId 索引删 videos
        const vIdx = t.objectStore(V).index('userId');
        const vReq = vIdx.openCursor(IDBKeyRange.only(uid));
        vReq.onsuccess = e => {
          const c = e.target.result;
          if (c) { c.delete(); c.continue(); }
        };

        // 3. 走 userId 索引删 pbs
        const pIdx = t.objectStore(P).index('userId');
        const pReq = pIdx.openCursor(IDBKeyRange.only(uid));
        pReq.onsuccess = e => {
          const c = e.target.result;
          if (c) { c.delete(); c.continue(); }
        };

        // 4. 删除 frontend_scores（keyPath = userId，直接 delete）
        t.objectStore(F).delete(uid);
      });
    } catch (e) {
      console.warn('删除缓存失败', e);
    }
  }

  async function clearAll() {
    if (!supported) return;
    try {
      await CacheDB.run([L, V, P, F], 'readwrite', t => {
        t.objectStore(L).clear();
        t.objectStore(V).clear();
        t.objectStore(P).clear();
        t.objectStore(F).clear();
      });
    } catch (e) {
      console.warn('清空缓存失败', e);
    }
  }

  async function list() {
    if (!supported) return [];
    try {
      const recs = await CacheDB.getAll(L);
      const out = [];
      for (const rec of recs) {
        const uid = String(rec.userId);
        const ids = (rec.videoIds || []).filter(id => id != null);
        let size = 0;
        if (ids.length) {
          const all = await fetchAllUserVideos(uid);
          size = new Blob([JSON.stringify(all)]).size;
        }
        out.push({
          userId: uid,
          count: ids.length,
          size,
          ts: rec.ts,
          age: Date.now() - rec.ts,
        });
      }
      return out.sort((a, b) => b.ts - a.ts);
    } catch (e) {
      console.warn('缓存列表失败', e);
      return [];
    }
  }

  async function getVideo(videoId) {
    if (!supported) return null;
    try {
      let v = await CacheDB.get(V, videoId);
      if (!v) v = await CacheDB.get(V, String(videoId));
      if (!v && Number.isFinite(Number(videoId))) v = await CacheDB.get(V, Number(videoId));
      return v || null;
    } catch { return null; }
  }

  async function getUserVideos(userId) {
    if (!supported) return [];
    try { return await fetchAllUserVideos(String(userId)); }
    catch { return []; }
  }

  async function getUserLevelVideos(userId, level) {
    if (!supported) return [];
    try {
      return await CacheDB.getAllByIndex(V, 'userId_level', [String(userId), level])
        .catch(() => []);
    } catch { return []; }
  }

  function ageText(age) {
    const s = Math.floor(age / 1000);
    if (s < 60) return `${s} 秒前`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} 分钟前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} 小时前`;
    return `${Math.floor(h / 24)} 天前`;
  }

  function fmtSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  return {
    read, write, remove, clearAll, list,
    getVideo, getUserVideos, getUserLevelVideos,
    ageText, fmtSize, supported,
  };
})();