const Cache = (() => {
  const V = CacheDB.STORE_VIDEOS;
  const L = CacheDB.STORE_LISTS;
  const supported = CacheDB.supported;

  /**
   * 读取用户视频列表。
   * 不依赖 store key 与 videoIds 元素的类型一致：
   * 走 userId 索引捞出全部视频，再按 videoIds 顺序重排。
   */
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

      // 用索引反查，无视 key 类型
      const all = await CacheDB.getAllByIndex(V, 'userId', uid);
      const vmap = new Map();
      for (const v of all) {
        // 统一字符串化，兼容 id 为数字/字符串两种情形
        if (v != null && v.id != null) vmap.set(String(v.id), v);
      }

      const data = ids
        .map(id => vmap.get(String(id)))
        .filter(Boolean);

      return { data, ts: rec.ts, age: Date.now() - rec.ts };
    } catch (e) {
      console.warn('缓存读取失败', e);
      return null;
    }
  }

  /** 写入：一次事务内同步 put 所有视频 + list */
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

  /** 删除某用户：先删 list，再走 userId 索引用 cursor 删所有视频 */
  async function remove(userId) {
    if (!supported) return;
    try {
      const uid = String(userId);
      await CacheDB.run([L, V], 'readwrite', t => {
        t.objectStore(L).delete(uid);
        const idx = t.objectStore(V).index('userId');
        const req = idx.openCursor(IDBKeyRange.only(uid));
        req.onsuccess = e => {
          const c = e.target.result;
          if (c) { c.delete(); c.continue(); }
        };
      });
    } catch (e) {
      console.warn('删除缓存失败', e);
    }
  }

  async function clearAll() {
    if (!supported) return;
    try {
      await CacheDB.run([L, V], 'readwrite', t => {
        t.objectStore(L).clear();
        t.objectStore(V).clear();
      });
    } catch (e) {
      console.warn('清空缓存失败', e);
    }
  }

  /**
   * 列出所有已缓存的用户。
   * 同样用 userId 索引反查视频，避免 key 类型不一致导致的空结果。
   */
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
          const all = await CacheDB.getAllByIndex(V, 'userId', uid);
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

  /* ---------------- 索引查询 ---------------- */

  async function getVideo(videoId) {
    if (!supported) return null;
    try {
      // 尝试数字和字符串两种 key
      let v = await CacheDB.get(V, videoId);
      if (!v) v = await CacheDB.get(V, String(videoId));
      return v || null;
    } catch { return null; }
  }

  async function getUserVideos(userId) {
    if (!supported) return [];
    try { return await CacheDB.getAllByIndex(V, 'userId', String(userId)); }
    catch { return []; }
  }

  async function getUserLevelVideos(userId, level) {
    if (!supported) return [];
    try {
      return await CacheDB.getAllByIndex(V, 'userId_level', [String(userId), level]);
    } catch { return []; }
  }

  /* ---------------- 工具 ---------------- */

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