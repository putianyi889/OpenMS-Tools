const Cache = (() => {
  const V = CacheDB.STORE_VIDEOS;
  const L = CacheDB.STORE_LISTS;
  const supported = CacheDB.supported;

  async function read(userId) {
    if (!supported) return null;
    try {
      return await CacheDB.tx([L, V], 'readonly', async t => {
        const rec = await CacheDB.req(t.objectStore(L).get(String(userId)));
        if (!rec) return null;
        const ids = rec.videoIds || [];
        const videos = ids.length
          ? await CacheDB.req(t.objectStore(V).getAll(ids))
          : [];
        const vmap = new Map(videos.map(v => [v.id, v]));
        return {
          data: ids.map(id => vmap.get(id)).filter(Boolean),
          ts: rec.ts,
          age: Date.now() - rec.ts,
        };
      });
    } catch (e) { console.warn('缓存读取失败', e); return null; }
  }

  async function write(userId, videos) {
    if (!supported || !Array.isArray(videos)) return false;
    try {
      return await CacheDB.tx([L, V], 'readwrite', t => {
        const vstore = t.objectStore(V);
        const ids = [];
        for (const v of videos) {
          if (v == null || v.id == null) continue;
          ids.push(v.id);
          vstore.put({ ...v, userId: String(userId) });
        }
        t.objectStore(L).put({
          userId: String(userId),
          videoIds: ids,
          ts: Date.now(),
        });
        return true;
      });
    } catch (e) { console.warn('缓存写入失败', e); return false; }
  }

  async function remove(userId) {
    if (!supported) return;
    try {
      await CacheDB.tx([L, V], 'readwrite', t => {
        t.objectStore(L).delete(String(userId));
        const idx = t.objectStore(V).index('userId');
        idx.openCursor(IDBKeyRange.only(String(userId))).onsuccess = e => {
          const c = e.target.result;
          if (c) { c.delete(); c.continue(); }
        };
      });
    } catch (e) { console.warn('删除缓存失败', e); }
  }

  async function clearAll() {
    if (!supported) return;
    try {
      await CacheDB.tx([L, V], 'readwrite', t => {
        t.objectStore(L).clear();
        t.objectStore(V).clear();
      });
    } catch (e) { console.warn('清空缓存失败', e); }
  }

  async function list() {
    if (!supported) return [];
    try {
      return await CacheDB.tx([L, V], 'readonly', async t => {
        const recs = await CacheDB.req(t.objectStore(L).getAll());
        const vstore = t.objectStore(V);
        const out = [];
        for (const rec of recs) {
          const ids = rec.videoIds || [];
          const videos = ids.length ? await CacheDB.req(vstore.getAll(ids)) : [];
          out.push({
            userId: rec.userId,
            count: ids.length,
            size: new Blob([JSON.stringify(videos)]).size,
            ts: rec.ts,
            age: Date.now() - rec.ts,
          });
        }
        return out.sort((a, b) => b.ts - a.ts);
      });
    } catch (e) { console.warn('缓存列表失败', e); return []; }
  }

  /* ---------------- 索引查询（供未来功能使用） ---------------- */

  async function getVideo(videoId) {
    if (!supported) return null;
    try {
      return await CacheDB.tx([V], 'readonly', t =>
        CacheDB.req(t.objectStore(V).get(Number(videoId))));
    } catch { return null; }
  }

  async function getUserVideos(userId) {
    if (!supported) return [];
    try {
      return await CacheDB.tx([V], 'readonly', t =>
        CacheDB.req(t.objectStore(V).index('userId').getAll(String(userId))));
    } catch { return []; }
  }

  async function getUserLevelVideos(userId, level) {
    if (!supported) return [];
    try {
      return await CacheDB.tx([V], 'readonly', t =>
        CacheDB.req(t.objectStore(V)
          .index('userId_level')
          .getAll([String(userId), level])));
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