/** 软实力：100 = NT 水平。含 9 个权重（3 level × 3 指标）。 */
const SoftPower = (() => {
  const W_KEY = 'openms_softpower_weights';
  const LEVELS = ['b', 'i', 'e'];
  const METRICS = ['t', 'b', 's'];

  const DEFAULT_WEIGHTS = {
    b: { t: 1.55, b: 2.2,  s: 1.25 },
    i: { t: 4.08, b: 4.08, s: 3.84 },
    e: { t: 5.28, b: 5.28, s: 5.44 },
  };

  /* ---------- 权重读写 ---------- */

  function getWeights() {
    try {
      const s = localStorage.getItem(W_KEY);
      if (!s) return structuredClone(DEFAULT_WEIGHTS);
      const obj = JSON.parse(s);
      const out = {};
      for (const lv of LEVELS) {
        out[lv] = {};
        for (const m of METRICS) {
          const v = obj?.[lv]?.[m];
          out[lv][m] = typeof v === 'number' && isFinite(v) && v >= 0
            ? v : DEFAULT_WEIGHTS[lv][m];
        }
      }
      return out;
    } catch { return structuredClone(DEFAULT_WEIGHTS); }
  }

  function setWeights(w) {
    const clean = {};
    for (const lv of LEVELS) {
      clean[lv] = {};
      for (const m of METRICS) {
        const v = w?.[lv]?.[m];
        if (typeof v !== 'number' || !isFinite(v) || v < 0) {
          throw new Error(`${lv}.${m} 不是有效的非负数`);
        }
        clean[lv][m] = v;
      }
    }
    localStorage.setItem(W_KEY, JSON.stringify(clean));
  }

  function clearWeights() { localStorage.removeItem(W_KEY); }

  /* ---------- 软实力计算 ---------- */

  /**
   * 对单个用户的前端成绩行计算 3 个等级软实力 + 总软实力。
   * @param {object} row  前端成绩对象（含 bt, bb, ..., es）
   * @param {object} nt   FrontendNT 缓存对象
   * @param {object} w    权重对象
   * @returns {{b:number|null, i:number|null, e:number|null, total:number|null}}
   */
  function computeOne(row, nt, w) {
    const weights = w || getWeights();
    const perLevel = {};
    const levelWeights = {};

    for (const lv of LEVELS) {
      let sum = 0, wt = 0;
      for (const m of METRICS) {
        const col = lv + m;
        const userVal = row[col];
        const ntVal = nt[col];
        if (typeof userVal !== 'number' || !isFinite(userVal)) continue;
        if (typeof ntVal !== 'number' || !isFinite(ntVal) || ntVal === 0) continue;

        let sp;
        if (m === 't') {
          // time: NT / 前端 * 100（越小越好）
          if (userVal === 0) continue;
          sp = ntVal / userVal * 100;
        } else {
          sp = userVal / ntVal * 100;
        }
        const wv = weights[lv][m];
        sum += sp * wv;
        wt += wv;
      }
      perLevel[lv] = wt > 0 ? sum / wt : null;
      levelWeights[lv] = weights[lv].t + weights[lv].b + weights[lv].s;
    }

    // 总软实力：三个等级软实力的加权平均，等级权重 = 该等级 3 个权重之和
    let sum = 0, wt = 0;
    for (const lv of LEVELS) {
      if (perLevel[lv] == null) continue;
      sum += perLevel[lv] * levelWeights[lv];
      wt += levelWeights[lv];
    }
    const total = wt > 0 ? sum / wt : null;

    return { ...perLevel, total };
  }

  return {
    DEFAULT_WEIGHTS, LEVELS, METRICS,
    getWeights, setWeights, clearWeights,
    computeOne,
  };
})();