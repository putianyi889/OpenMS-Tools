/** 前端成绩：每用户 9 个桶（level × 指标）的前 N 名均值。 */
const FrontendScores = (() => {
  const S = 'frontend_scores';
  const TOPN_KEY = 'openms_frontend_topn';
  const DEFAULT_TOPN = 5;
  const MAX_TOPN = 100;
  const LEVELS = ['b', 'i', 'e'];
  const METRICS = ['t', 'b', 's'];
  const COL_KEYS = LEVELS.flatMap(lv => METRICS.map(m => lv + m));
  const ASC_KEYS = new Set(['bt', 'it', 'et']);   // 升序列（越小越好）

  /* ---------- topN 配置 ---------- */

  function getTopN() {
    try {
      const v = parseInt(localStorage.getItem(TOPN_KEY), 10);
      return Number.isFinite(v) && v >= 1 && v <= MAX_TOPN ? v : DEFAULT_TOPN;
    } catch { return DEFAULT_TOPN; }
  }

  function setTopN(n) {
    const v = parseInt(n, 10);
    if (!Number.isFinite(v) || v < 1 || v > MAX_TOPN)
      throw new Error(`前 N 名必须在 1–${MAX_TOPN} 之间`);
    localStorage.setItem(TOPN_KEY, String(v));
  }

  /* ---------- 数值计算 ---------- */

  function avgTopN(values, asc, n) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => asc ? a - b : b - a);
    return sorted.slice(0, n).reduce((s, v) => s + v, 0) / Math.min(n, values.length);
  }

  function computeForUser(userId, pbs, topN) {
    const rec = { userId: String(userId), topN, ts: Date.now() };
    for (const k of COL_KEYS) rec[k] = null;

    const cMap = {};
    for (const lv of LEVELS) {
      const level = PB_LEVELS.find(l => l.key === lv);
      cMap[lv] = level ? level.stnbC : 0;
    }

    const byLevel = { b: [], i: [], e: [] };
    for (const pb of pbs) {
      if (!pb || !pb.level) continue;
      const k = String(pb.level).toLowerCase();
      if (!LEVELS.includes(k)) continue;
      if (typeof pb.timems !== 'number' || pb.timems <= 0) continue;
      const bv = Number(pb.bv);
      if (!Number.isFinite(bv)) continue;
      if (k === 'b' && bv < 10) continue;  // b 级额外筛选 bv >= 10
      byLevel[k].push(pb);
    }

    for (const lv of LEVELS) {
      const list = byLevel[lv];
      if (!list.length) continue;
      const tArr = list.map(p => p.timems / 1000);
      const bArr = list.map(p => p.bv / (p.timems / 1000));
      const sArr = list.map(p => cMap[lv] * p.bv / Math.pow(p.timems / 1000, 1.7));
      rec[lv + 't'] = avgTopN(tArr, true,  topN);
      rec[lv + 'b'] = avgTopN(bArr, false, topN);
      rec[lv + 's'] = avgTopN(sArr, false, topN);
    }
    return rec;
  }

  /* ---------- 缓存读写 ---------- */

  async function writeUser(userId, pbs, topN) {
    const rec = computeForUser(userId, pbs, topN);
    await CacheDB.run([S], 'readwrite', t => t.objectStore(S).put(rec));
    return rec;
  }

  async function get(userId) {
    if (!CacheDB.supported) return null;
    try { return await CacheDB.get(S, String(userId)); }
    catch { return null; }
  }

  async function getAll() {
    if (!CacheDB.supported) return [];
    try { return await CacheDB.getAll(S); }
    catch { return []; }
  }

  async function count() {
    if (!CacheDB.supported) return 0;
    try { return await CacheDB.count(S); }
    catch { return 0; }
  }

  async function clearAll() {
    if (!CacheDB.supported) return;
    await CacheDB.clearStore(S);
  }

  /* ---------- 全量重算 ---------- */

  async function recalcAll(onProgress) {
    if (!CacheDB.supported) return { total: 0, ok: 0, fail: 0 };
    const topN = getTopN();
    const lists = await CacheDB.getAll(CacheDB.STORE_LISTS);
    let done = 0, ok = 0, fail = 0;

    for (const rec of lists) {
      const uid = String(rec.userId);
      try {
        const pbs = await PBCache.getByUser(uid);
        const out = computeForUser(uid, pbs, topN);
        await CacheDB.run([S], 'readwrite', t => t.objectStore(S).put(out));
        ok++;
      } catch (e) {
        console.warn(`重算用户 ${uid} 前端成绩失败`, e);
        fail++;
      }
      done++;
      onProgress && onProgress({ done, total: lists.length, current: uid, ok, fail });
    }
    return { total: lists.length, ok, fail };
  }

  return {
    getTopN, setTopN, DEFAULT_TOPN, MAX_TOPN,
    COL_KEYS, ASC_KEYS,
    computeForUser, writeUser,
    get, getAll, count, clearAll, recalcAll,
  };
})();