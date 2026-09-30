/**
 * IndexedDB 统一封装。
 * 所有业务 store 都在此定义：videos / video_lists / pbs / frontend_scores / users / user_sync。
 * 幂等创建：onupgradeneeded 里逐个判断 store 是否存在，缺则建。
 */
const CacheDB = (() => {
  const DB_NAME = 'openms_video_cache';
  const DB_VERSION = 6;
  const STORE_VIDEOS = 'videos';
  const STORE_LISTS = 'video_lists';
  const STORE_PBS = 'pbs';
  const STORE_FRONTEND = 'frontend_scores';
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

        // 1. videos：视频主表
        if (!db.objectStoreNames.contains(STORE_VIDEOS)) {
          const s = db.createObjectStore(STORE_VIDEOS, { keyPath: 'id' });
          s.createIndex('userId', 'userId', { unique: false });
          s.createIndex('userId_level', ['userId', 'level'], { unique: false });
          s.createIndex('userId_level_bv', ['userId', 'level', 'bv'], { unique: false });
          s.createIndex('level_bv', ['level', 'bv'], { unique: false });
        }

        // 2. video_lists：用户 → 视频 id 列表
        if (!db.objectStoreNames.contains(STORE_LISTS)) {
          const s = db.createObjectStore(STORE_LISTS, { keyPath: 'userId' });
          s.createIndex('ts', 'ts', { unique: false });
        }

        // 3. pbs：每用户每 (level, bv) 的 PB
        if (!db.objectStoreNames.contains(STORE_PBS)) {
          const s = db.createObjectStore(STORE_PBS, { keyPath: ['userId', 'level', 'bv'] });
          s.createIndex('userId', 'userId', { unique: false });
          s.createIndex('level_bv', ['level', 'bv'], { unique: false });
        }

        // 4. frontend_scores：每用户九桶前 N 均值
        if (!db.objectStoreNames.contains(STORE_FRONTEND)) {
          db.createObjectStore(STORE_FRONTEND, { keyPath: 'userId' });
        }

        // 5. users：用户信息
        if (!db.objectStoreNames.contains(STORE_USERS)) {
          const s = db.createObjectStore(STORE_USERS, { keyPath: 'userId' });
          s.createIndex('realname', 'realname', { unique: false });
        }

        // 6. user_sync：同步元数据
        if (!db.objectStoreNames.contains(STORE_SYNC)) {
          db.createObjectStore(STORE_SYNC, { keyPath: 'key' });
        }
      };

      req.onsuccess = e => {
        const db = e.target.result;
        // 其他标签页请求升级时主动让出连接，避免阻塞
        db.onversionchange = () => {
          try { db.close(); } catch {}
          dbPromise = null;
          const el = document.getElementById('status');
          if (el) {
            el.textContent = '数据库已被其他标签页升级，请刷新页面';
            el.className = 'status error';
          }
        };
        resolve(db);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error(
        '数据库升级被其他标签页阻塞，请关闭本网站的其他标签页后刷新'
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
  function count(storeName) {
    return run([storeName], 'readonly', t => t.objectStore(storeName).count());
  }
  function clearStore(storeName) {
    return run([storeName], 'readwrite', t => t.objectStore(storeName).clear());
  }

  return {
    openDB, run,
    get, getAll, getAllByIndex, count, clearStore,
    supported,
    STORE_VIDEOS, STORE_LISTS, STORE_PBS,
    STORE_FRONTEND, STORE_USERS, STORE_SYNC,
    DB_VERSION,
  };
})();