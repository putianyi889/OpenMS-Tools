/**
 * IndexedDB 底层封装。
 * 关键约束：run() 里的 fn 必须是同步函数，不能 await，
 * 否则事务会在 await 期间被浏览器自动提交，导致后续请求拿不到数据。
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
        // 全量迁移：清空所有旧 store
        for (const name of Array.from(db.objectStoreNames)) {
          db.deleteObjectStore(name);
        }
        // 视频主表
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
      req.onblocked = () => reject(new Error(
        '数据库升级被其他标签页阻塞，请关闭其它标签页后重试'
      ));
    });
    return dbPromise;
  }

  /**
   * 打开一个事务，同步执行 fn(t)，等事务完成后 resolve。
   * fn 内必须同步发出所有 IDBRequest（可以挂 onsuccess 处理 cursor），
   * 但不能 await 任何东西。
   */
  function run(storeNames, mode, fn) {
    return openDB().then(db => new Promise((resolve, reject) => {
      let t;
      try {
        t = db.transaction(storeNames, mode);
      } catch (e) {
        reject(e);
        return;
      }

      let result;
      try {
        result = fn(t);
      } catch (e) {
        try { t.abort(); } catch {}
        reject(e);
        return;
      }

      t.oncomplete = () => {
        if (result && typeof result === 'object' && 'result' in result) {
          resolve(result.result);
        } else {
          resolve(undefined);
        }
      };
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('transaction aborted'));
    }));
  }

  /** 单请求读取 */
  function get(storeName, key) {
    return run([storeName], 'readonly', t => t.objectStore(storeName).get(key));
  }

  /** 单请求读取多个 key（按 key 批量） */
  function getAll(storeName, query) {
    return run([storeName], 'readonly', t => t.objectStore(storeName).getAll(query));
  }

  /** 走索引批量读取 */
  function getAllByIndex(storeName, indexName, query) {
    return run([storeName], 'readonly', t =>
      t.objectStore(storeName).index(indexName).getAll(query));
  }

  return {
    openDB, run, get, getAll, getAllByIndex,
    supported,
    STORE_VIDEOS, STORE_LISTS, DB_VERSION,
  };
})();