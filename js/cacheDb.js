const CacheDB = (() => {
  const DB_NAME = 'openms_video_cache';
  const DB_VERSION = 3;
  const STORE_VIDEOS = 'videos';
  const STORE_LISTS = 'video_lists';
  const STORE_PBS = 'pbs';
  const supported = typeof indexedDB !== 'undefined';
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const db = e.target.result;
        // 增量升级：只为缺失的 store 创建结构，保留已有数据
        if (!db.objectStoreNames.contains(STORE_VIDEOS)) {
          const videos = db.createObjectStore(STORE_VIDEOS, { keyPath: 'id' });
          videos.createIndex('userId', 'userId', { unique: false });
          videos.createIndex('userId_level', ['userId', 'level'], { unique: false });
          videos.createIndex('userId_level_bv', ['userId', 'level', 'bv'], { unique: false });
          videos.createIndex('level_bv', ['level', 'bv'], { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_LISTS)) {
          const lists = db.createObjectStore(STORE_LISTS, { keyPath: 'userId' });
          lists.createIndex('ts', 'ts', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_PBS)) {
          // 复合主键：[userId, level, bv]
          const pbs = db.createObjectStore(STORE_PBS, {
            keyPath: ['userId', 'level', 'bv']
          });
          pbs.createIndex('userId', 'userId', { unique: false });
          pbs.createIndex('level_bv', ['level', 'bv'], { unique: false });
        }
      };

      req.onsuccess = e => resolve(e.target.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error(
        '数据库升级被其他标签页阻塞，请关闭其它标签页后重试'
      ));
    });
    return dbPromise;
  }

  /** 同步 fn 事务；fn 内不能 await */
  function run(storeNames, mode, fn) {
    return openDB().then(db => new Promise((resolve, reject) => {
      let t;
      try { t = db.transaction(storeNames, mode); }
      catch (e) { reject(e); return; }
      let result;
      try { result = fn(t); }
      catch (e) { try { t.abort(); } catch {} reject(e); return; }
      t.oncomplete = () => {
        if (result && typeof result === 'object' && 'result' in result) resolve(result.result);
        else resolve(undefined);
      };
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('transaction aborted'));
    }));
  }

  function get(storeName, key) {
    return run([storeName], 'readonly', t => t.objectStore(storeName).get(key));
  }
  function getAll(storeName, query) {
    return run([storeName], 'readonly', t => t.objectStore(storeName).getAll(query));
  }
  function getAllByIndex(storeName, indexName, query) {
    return run([storeName], 'readonly', t =>
      t.objectStore(storeName).index(indexName).getAll(query));
  }

  return {
    openDB, run, get, getAll, getAllByIndex,
    supported,
    STORE_VIDEOS, STORE_LISTS, STORE_PBS, DB_VERSION,
  };
})();