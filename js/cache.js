const Cache = (() => {
  const DB_NAME = 'openms_video_cache';
  const DB_VERSION = 1;
  const STORE = 'videos';
  const supported = typeof indexedDB !== 'undefined';
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE))
          db.createObjectStore(STORE, { keyPath: 'userId' });
      };
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(e.target.error);
    });
    return dbPromise;
  }

  function tx(mode, fn) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      let result;
      try { result = fn(t.objectStore(STORE)); }
      catch (e) { reject(e); return; }
      t.oncomplete = () => resolve(result && result.result);
      t.onerror = () => reject(t.error);
    }));
  }

  async function read(userId) {
    if (!supported) return null;
    try {
      const r = await tx('readonly', s => s.get(String(userId)));
      if (!r) return null;
      return { data: r.data, ts: r.ts, age: Date.now() - r.ts };
    } catch (e) { console.warn('缓存读取失败', e); return null; }
  }

  async function write(userId, data) {
    if (!supported) return false;
    try {
      await tx('readwrite', s => s.put({ userId: String(userId), data, ts: Date.now() }));
      return true;
    } catch (e) { console.warn('缓存写入失败', e); return false; }
  }

  async function remove(userId) {
    if (!supported) return;
    try { await tx('readwrite', s => s.delete(String(userId))); } catch {}
  }

  async function clearAll() {
    if (!supported) return;
    try { await tx('readwrite', s => s.clear()); } catch {}
  }

  async function list() {
    if (!supported) return [];
    try {
      const records = await tx('readonly', s => s.getAll());
      return records.map(r => ({
        userId: r.userId,
        count: Array.isArray(r.data) ? r.data.length : 0,
        size: new Blob([JSON.stringify(r.data)]).size,
        ts: r.ts,
        age: Date.now() - r.ts,
      })).sort((a, b) => b.ts - a.ts);
    } catch (e) { console.warn('缓存列表失败', e); return []; }
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

  return { read, write, remove, clearAll, list, ageText, fmtSize, supported };
})();