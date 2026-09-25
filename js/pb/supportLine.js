/** 支撑线：计算与重算。支持等级限定为 i / e。 */
const SUPPORT_LEVEL_KEYS = ['i', 'e'];

/**
 * 从点集合计算帕累托前沿。
 * @param {Array<{bv:number, timems:number, bvs?:number}>} points
 * @returns {Array<{bv, timems, bvs}>} 按 bv 升序的前沿点
 */
function computeSupportFrontier(points) {
  const sorted = points
    .filter(p => typeof p.timems === 'number' && p.timems > 0 && typeof p.bv === 'number')
    .map(p => ({
      bv: p.bv,
      timems: p.timems,
      bvs: typeof p.bvs === 'number' ? p.bvs : p.bv / (p.timems / 1000),
    }))
    .sort((a, b) => a.bv - b.bv);

  const front = [];
  for (const p of sorted) {
    let dominated = false;
    for (const q of front) {
      if (q.timems <= p.timems && q.bvs >= p.bvs) { dominated = true; break; }
    }
    if (dominated) continue;
    for (let i = front.length - 1; i >= 0; i--) {
      const q = front[i];
      if (p.timems <= q.timems && p.bvs >= q.bvs) front.splice(i, 1);
    }
    front.push(p);
  }
  return front;
}

/** 从一组 PB（同一 user、同一 level）计算支撑线，返回帕累托 bv 的 Set。 */
function computeSupportLineSet(pbs) {
  return new Set(computeSupportFrontier(pbs).map(p => p.bv));
}

/**
 * 合并多个用户的支撑线。
 * 输入是多个「点数组」，先把所有点按 bv 去重取 timems 最小，再跑一次前沿。
 * @param {Array<Array<{bv, timems, bvs}>>} seriesPointsList
 * @returns {Array<{bv, timems, bvs}>} 按 bv 升序的合并前沿
 */
function computeMergedSupportLine(seriesPointsList) {
  const byBv = new Map();
  for (const points of seriesPointsList) {
    for (const p of points) {
      const cur = byBv.get(p.bv);
      if (!cur || p.timems < cur.timems) byBv.set(p.bv, p);
    }
  }
  return computeSupportFrontier([...byBv.values()]);
}

/**
 * 重算所有已缓存用户的支撑线，写回 pbs.support 字段。
 * 只处理 SUPPORT_LEVEL_KEYS；其他等级 support 强制为 false。
 */
async function recalcAllSupportLines(levels, onProgress) {
  if (!CacheDB.supported) return { total: 0, updated: 0 };
  const S = CacheDB.STORE_PBS, L = CacheDB.STORE_LISTS;
  const lists = await CacheDB.getAll(L);
  const supported = levels.filter(lv => SUPPORT_LEVEL_KEYS.includes(lv.key));
  let done = 0, updated = 0;

  for (const rec of lists) {
    const uid = String(rec.userId);
    const allPBs = await CacheDB.getAllByIndex(S, 'userId', uid);

    const byLevel = new Map();
    for (const pb of allPBs) {
      if (!pb || !pb.level) continue;
      if (!byLevel.has(pb.level)) byLevel.set(pb.level, []);
      byLevel.get(pb.level).push(pb);
    }

    const updates = [];
    for (const level of supported) {
      const levelPBs = byLevel.get(level.key) || [];
      if (!levelPBs.length) continue;
      const supportSet = computeSupportLineSet(levelPBs);
      for (const pb of levelPBs) {
        const shouldBe = supportSet.has(pb.bv);
        if (!!pb.support !== shouldBe) updates.push({ ...pb, support: shouldBe });
      }
    }
    for (const [key, pbs] of byLevel) {
      if (SUPPORT_LEVEL_KEYS.includes(key)) continue;
      for (const pb of pbs) if (pb.support) updates.push({ ...pb, support: false });
    }

    if (updates.length) {
      await CacheDB.run([S], 'readwrite', t => {
        const store = t.objectStore(S);
        for (const u of updates) store.put(u);
      });
      updated += updates.length;
    }
    done++;
    onProgress && onProgress({ done, total: lists.length, current: uid, updated });
  }
  return { total: lists.length, updated };
}