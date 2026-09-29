/** 前端成绩锚点 NT：对九列各取前 N 名的平均值，缓存在 localStorage。 */
const FrontendNT = (() => {
  const KEY = 'openms_frontend_nt';
  const N_KEY = 'openms_frontend_nt_n';
  const DEFAULT_N = 20;
  const MAX_N = 500;
  const LEVELS = ['b', 'i', 'e'];
  const METRICS = ['t', 'b', 's'];
  const COLS = LEVELS.flatMap(lv => METRICS.map(m => lv + m));
  const ASC_COLS = new Set(['bt', 'it', 'et']);

  /* ---------- 前 N 名配置 ---------- */

  function getN() {
    try {
      const v = parseInt(localStorage.getItem(N_KEY), 10);
      return Number.isFinite(v) && v >= 1 && v <= MAX_N ? v : DEFAULT_N;
    } catch { return DEFAULT_N; }
  }

  function setN(n) {
    const v = parseInt(n, 10);
    if (!Number.isFinite(v) || v < 1 || v > MAX_N)
      throw new Error(`前 N 名必须在 1–${MAX_N} 之间`);
    localStorage.setItem(N_KEY, String(v));
  }

  /* ---------- 缓存读写 ---------- */

  function get() {
    try {
      const s = localStorage.getItem(KEY);
      if (!s) return null;
      const obj = JSON.parse(s);
      if (!obj || typeof obj !== 'object') return null;
      for (const k of COLS) {
        if (!(k in obj)) return null;
      }
      return obj;
    } catch { return null; }
  }

  function save(nt) {
    localStorage.setItem(KEY, JSON.stringify({ ...nt, ts: Date.now() }));
  }

  function clear() { localStorage.removeItem(KEY); }
  function hasNT() { return get() !== null; }

  /* ---------- 计算 ---------- */

  /**
   * 对 rows（前端成绩对象数组）的每一列取前 N 名求平均。
   * @returns {{bt,bb,bs,it,ib,is,et,eb,es}}
   */
  function compute(rows, n) {
    const N = n || getN();
    const nt = {};
    for (const col of COLS) {
      const values = rows
        .map(r => r && r[col])
        .filter(v => typeof v === 'number' && isFinite(v))
        .sort((a, b) => ASC_COLS.has(col) ? a - b : b - a);
      const top = values.slice(0, N);
      nt[col] = top.length
        ? top.reduce((s, v) => s + v, 0) / top.length
        : null;
    }
    return nt;
  }

  function computeAndSave(rows) {
    const nt = compute(rows);
    save(nt);
    return nt;
  }

  return {
    DEFAULT_N, MAX_N, COLS,
    getN, setN,
    get, save, clear, hasNT,
    compute, computeAndSave,
  };
})();