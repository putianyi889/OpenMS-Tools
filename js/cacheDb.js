/**
 * IndexedDB 底层封装。
 * DB_VERSION 2 会全量删除旧 store 并重建，实现"迁移即清空"。
 */
const CacheDB = (() => {
  const DB_NAME = 'openms_video_cache';
  const DB_VERSION = 2;
  const STORE_VIDEOS = 'videos';
  const STORE_LISTS = 'video_lists';
  const supported = typeof indexedDB !== 'undefined';

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const db = e.target.result;
        // 全量迁移：先清空所有旧 store
        for (const name of Array.from(db.objectStoreNames)) {
          db.deleteObjectStore(name);
        }

        // 视频主表：按视频 id 存，userId 作为普通字段
        const videos = db.createObjectStore(STORE_VIDEOS, { keyPath: 'id' });
        videos.createIndex('userId', 'userId', { unique: false });
        videos.createIndex('userId_level', ['userId', 'level'], { unique: false });
        videos.createIndex('userId_level_bv', ['userId', 'level', 'bv'], { unique: false });
        videos.createIndex('level_bv', ['level', 'bv'], { unique: false });

        // 用户 → 视频 id 列表
        const lists = db.createObjectStore(STORE_LISTS, { keyPath: 'userId' });
        lists.createIndex('ts', 'ts', { unique: false });
      };

      req.onsuccess = e => resolve(e.target.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('数据库升级被其他标签页阻塞，请关闭其它标签页后重试'));
    });
    return dbPromise;
  }

  /** IDBRequest → Promise */
  function req(r) {
    return new Promise((resolve, reject) => {
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  /**
   * 事务封装。fn(t) 里可以同步或异步地使用 t，
   * 只要 await 的对象是 IDBRequest，事务就不会提前提交。
   */
  function tx(stores, mode, fn) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(stores, mode);
      const p = Promise.resolve(fn(t));
      t.oncomplete = () => p.then(resolve).catch(reject);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('transaction aborted'));
    }));
  }

  return { openDB, req, tx, supported, STORE_VIDEOS, STORE_LISTS, DB_VERSION };
})();