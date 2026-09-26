/**
 * 用户信息缓存的底层 IndexedDB 封装。
 * 与 CacheDB 共用同一个数据库（openms_video_cache），通过版本升级添加新 store。
 */
const UserCacheDB = (() => {
  const DB_NAME = 'openms_video_cache';
  const DB_VERSION = 4;  // 从 3 升到 4，增量添加用户相关 store
  const STORE_USERS = 'users';
  const STORE_SYNC = 'user_sync';
  const supported = typeof indexedDB !== 'undefined';
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const db = e.target.result;
        // 已有的 store 保持不变（videos / video_lists / pbs）
        // 新增：users —— keyPath = userId
        if (!db.objectStoreNames.contains(STORE_USERS)) {
          const users = db.createObjectStore(STORE_USERS, { keyPath: 'userId' });
          users.createIndex('updated_at', 'updated_at', { unique: false });
          users.createIndex('realname', 'realname', { unique: false });
        }
        // 新增：user_sync —— keyPath = key（单条记录，key = 'meta'）
        if (!db.objectStoreNames.contains(STORE_SYNC)) {
          db.createObjectStore(STORE_SYNC, { keyPath: 'key' });
        }
      };

      req.onsuccess = e => {
        const db = e.target.result;
        db.onversionchange = () => {
          try { db.close(); } catch {}
          dbPromise = null;
          const el = document.getElementById('status');
          const msg = '数据库已被其他标签页升级，请刷新页面';
          if (el) { el.textContent = msg; el.className = 'status error'; }
          else alert(msg);
        };
        resolve(db);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('数据库升级被其他标签页阻塞'));
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
  function count(storeName) {
    return run([storeName], 'readonly', t => t.objectStore(storeName).count());
  }
  function clearStore(storeName) {
    return run([storeName], 'readwrite', t => t.objectStore(storeName).clear());
  }

  return {
    openDB, run, get, getAll, getAllByIndex, count, clearStore,
    supported,
    STORE_USERS, STORE_SYNC, DB_VERSION,
  };
})();