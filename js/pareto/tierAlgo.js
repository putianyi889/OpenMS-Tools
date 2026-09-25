/**
 * 分档（Tier）与子分档（Sub-tier）计算。
 * 输入：users = [{ userId, points: [{bv, timems, bvs}] }]
 *   points 是已计算的支撑线点（bv 升序即 timems 升序即 bvs 升序）。
 * 输出：{ tierOf, subtierOf, tierLines }
 *   tierOf     : Map<userId, tier>       tier 从 1 开始
 *   subtierOf  : Map<userId, subtier>    subtier 从 1 开始
 *   tierLines  : Map<tier, points[]>     每档的分档线（该档 subtier 1 合并）
 */
const TierAlgo = (() => {

  /* ---------------- 数据准备 ---------------- */

  function prep(u) {
    const points = [...u.points].sort((a, b) => a.timems - b.timems);
    const n = points.length;
    const timems = new Float64Array(n);
    const prefixMaxB = new Float64Array(n);
    let run = -Infinity;
    for (let i = 0; i < n; i++) {
      timems[i] = points[i].timems;
      run = Math.max(run, points[i].bvs);
      prefixMaxB[i] = run;
    }
    return {
      userId: u.userId, points, timems, prefixMaxB,
      minT: timems[0], maxT: timems[n - 1],
      minB: points[0].bvs, maxB: prefixMaxB[n - 1],
    };
  }

  /** 最大的 i 使 timems[i] <= T；无则返回 -1 */
  function bisectRight(arr, T) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] <= T) lo = mid + 1; else hi = mid;
    }
    return lo - 1;
  }

  /** step_u(T) = max{ bvs : p.timems <= T } */
  function step(u, T) {
    const i = bisectRight(u.timems, T);
    return i < 0 ? -Infinity : u.prefixMaxB[i];
  }

  /* ---------------- 支配 ---------------- */

  /** u 用户支配 v ⇔ step_u(minT_v) >= maxB_v */
  function dominates(u, v) { return step(u, v.minT) >= v.maxB; }

  /** u 严格用户支配 v（排除互为支配） */
  function strictDominates(u, v) {
    return dominates(u, v) && !dominates(v, u);
  }

  /* ---------------- 线支配 ---------------- */

  /** 快速否定：u 不可能线支配 v */
  function cannotLineDominate(u, v) {
    return u.minT > v.maxT || u.maxB < v.minB;
  }

  /** 合并两个前沿（均按 timems 升序）；返回 true 表示只含 up 的点 */
  function mergeFrontier(up, vp) {
    let i = 0, j = 0, onlyU = true;
    const merged = [];
    const push = p => {
      const last = merged[merged.length - 1];
      if (!last || !(last.timems <= p.timems && last.bvs >= p.bvs)) {
        merged.push(p);
        return true;
      }
      return false;
    };
    while (i < up.length && j < vp.length) {
      if (up[i].timems <= vp[j].timems) { push(up[i]); i++; }
      else { if (push(vp[j])) onlyU = false; j++; }
    }
    while (i < up.length) { push(up[i]); i++; }
    while (j < vp.length) { if (push(vp[j])) onlyU = false; j++; }
    return onlyU;
  }

  /** u 线支配 v */
  function lineDominates(u, v) {
    if (dominates(u, v)) return true;
    if (cannotLineDominate(u, v)) return false;
    return mergeFrontier(u.points, v.points);
  }

  /* ---------------- Kahn 分层 ---------------- */

  function kahnLayer(users, edgeFn) {
    const N = users.length;
    const indeg = new Int32Array(N);
    const adj = Array.from({ length: N }, () => []);
    for (let i = 0; i < N; i++) {
      const ui = users[i];
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        if (edgeFn(ui, users[j])) { adj[i].push(j); indeg[j]++; }
      }
    }
    const res = new Map();
    let queue = [];
    for (let i = 0; i < N; i++) if (indeg[i] === 0) queue.push(i);
    let t = 1;
    while (queue.length) {
      const next = [];
      for (const i of queue) {
        res.set(users[i].userId, t);
        for (const j of adj[i]) if (--indeg[j] === 0) next.push(j);
      }
      queue = next; t++;
    }
    return res;
  }

  /* ---------------- 分档线合并 ---------------- */

  function mergePoints(pointsList) {
    const byBv = new Map();
    for (const pts of pointsList) {
      for (const p of pts) {
        const cur = byBv.get(p.bv);
        if (!cur || p.timems < cur.timems) byBv.set(p.bv, p);
      }
    }
    const sorted = [...byBv.values()].sort((a, b) => a.bv - b.bv);
    const front = [];
    for (const p of sorted) {
      let dom = false;
      for (const q of front) {
        if (q.timems <= p.timems && q.bvs >= p.bvs) { dom = true; break; }
      }
      if (dom) continue;
      for (let i = front.length - 1; i >= 0; i--) {
        const q = front[i];
        if (p.timems <= q.timems && p.bvs >= q.bvs) front.splice(i, 1);
      }
      front.push(p);
    }
    return front;
  }

  /* ---------------- 主流程 ---------------- */

  function computeTiers(users, options = {}) {
    const onProgress = options.onProgress || (() => {});
    if (!users.length) return { tierOf: new Map(), subtierOf: new Map(), tierLines: new Map() };

    const prepared = users
      .filter(u => u.points && u.points.length)
      .map(prep)
      .sort((a, b) => a.minT - b.minT || b.maxB - a.maxB);

    /* 阶段 1：用户支配图 → 分档 */
    const tierOf = kahnLayer(prepared, (u, v) => {
      if (u.minT > v.minT || u.maxB < v.maxB) return false;
      return strictDominates(u, v);
    });
    onProgress({ phase: 'tier', done: 1, total: 1 });

    /* 阶段 2：每个 tier 内部 → 子分档 */
    const byTier = new Map();
    for (const u of prepared) {
      const t = tierOf.get(u.userId);
      if (!byTier.has(t)) byTier.set(t, []);
      byTier.get(t).push(u);
    }

    const subtierOf = new Map();
    let d = 0;
    for (const group of byTier.values()) {
      const sub = kahnLayer(group, (u, v) => {
        if (u.minT > v.minT || u.maxB < v.maxB) return false;
        if (strictDominates(u, v)) return true;         // 用户严格支配 ⟹ 线严格支配
        if (cannotLineDominate(u, v)) return false;     // 快速否定
        if (!mergeFrontier(u.points, v.points)) return false;  // u 不线支配 v
        if (strictDominates(v, u)) return false;        // 理论不可达
        if (cannotLineDominate(v, u)) return true;      // v 不线支配 u → 严格成立
        return !mergeFrontier(v.points, u.points);      // 完整判 v 是否也线支配 u
      });
      for (const [uid, st] of sub) subtierOf.set(uid, st);
      d++;
      onProgress({ phase: 'subtier', done: d, total: byTier.size });
    }

    /* 阶段 3：每档分档线 + 每个子档线 */
    const tierLines = new Map();
    const subtierLines = new Map();
    for (const [t, group] of byTier) {
      const bySub = new Map();
      for (const u of group) {
        const st = subtierOf.get(u.userId);
        if (!bySub.has(st)) bySub.set(st, []);
        bySub.get(st).push(u);
      }
      for (const [st, us] of bySub) {
        const key = `${t}-${st}`;
        const line = mergePoints(us.map(u => u.points));
        subtierLines.set(key, line);
        if (st === 1) tierLines.set(t, line);
      }
    }
    onProgress({ phase: 'tierLines', done: 1, total: 1 });

    return { tierOf, subtierOf, tierLines, subtierLines };
  }

  return { computeTiers };
})();