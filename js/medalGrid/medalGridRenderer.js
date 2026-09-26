/** 奖牌图渲染：每个 (level, bv) 显示该位置 rank 的用户。
 *  用户名的背景色 = 该用户在本 (level, rank) 下出现次数的排名色阶。 */
class MedalGridRenderer {
  constructor(levels) {
    this.levels = levels;
  }

  renderAll(container, rank, userMap) {
    container.innerHTML = this.levels
      .map(lv => this.renderSection(lv, rank, userMap))
      .join('');
  }

  /**
   * 统计该 level 该 rank 下每个用户出现的次数，
   * 按次数降序分配名次，返回 Map<userId, occurrenceRank>。
   * 出现次数相同者共享名次。
   */
  computeUserRanks(level, rank) {
    const counts = new Map();
    for (let bv = level.minBv; bv <= level.maxBv; bv++) {
      const records = MedalGridData.getAtRank(level.key, bv, rank);
      for (const r of records) {
        if (r.userId == null) continue;
        const uid = String(r.userId);
        counts.set(uid, (counts.get(uid) || 0) + 1);
      }
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const rankMap = new Map();
    let prevCount = null, curRank = 0;
    for (let i = 0; i < sorted.length; i++) {
      const [uid, count] = sorted[i];
      if (count !== prevCount) curRank = i + 1;
      prevCount = count;
      rankMap.set(uid, curRank);
    }
    return { rankMap, counts };
  }

  renderSection(level, rank, userMap) {
    const { rankMap } = this.computeUserRanks(level, rank);

    let minTens = Infinity, maxTens = -Infinity, count = 0;
    for (let bv = level.minBv; bv <= level.maxBv; bv++) {
      if (MedalGridData.getAtRank(level.key, bv, rank).length) {
        const tens = Math.floor(bv / 10);
        if (tens < minTens) minTens = tens;
        if (tens > maxTens) maxTens = tens;
        count++;
      }
    }

    const title = `
      <h2 class="mg-title">
        ${level.label} 级
        <span class="mg-sub">
          bv ${level.minBv}–${level.maxBv} · Rank ${rank} ·
          ${count ? count + ' 个位置' : '无记录'}
        </span>
      </h2>`;

    if (count === 0) {
      return `<section class="mg-section">${title}</section>`;
    }

    const cells = [`<div class="mg-corner"></div>`];
    for (let ones = 0; ones <= 9; ones++) {
      cells.push(`<div class="mg-col-label">${ones}</div>`);
    }
    for (let tens = minTens; tens <= maxTens; tens++) {
      cells.push(`<div class="mg-row-label">${tens}</div>`);
      for (let ones = 0; ones <= 9; ones++) {
        cells.push(this.renderCell(level, tens * 10 + ones, rank, userMap, rankMap));
      }
    }

    return `<section class="mg-section">${title}
      <div class="mg-grid">${cells.join('')}</div>
    </section>`;
  }

  renderCell(level, bv, rank, userMap, rankMap) {
    if (bv < level.minBv || bv > level.maxBv) {
      return `<div class="mg-cell mg-empty"></div>`;
    }
    const records = MedalGridData.getAtRank(level.key, bv, rank);
    if (!records.length) {
      return `<div class="mg-cell mg-missing">—</div>`;
    }

    const lines = records.map(r => {
      const uid = String(r.userId ?? '?');
      const label = UserLabel.format(uid, userMap.get(uid));
      const occRank = rankMap.get(uid);
      const style = typeof occRank === 'number'
        ? ColorScale.styleFor(occRank, 'rank')
        : '';
      const styleAttr = style ? ` style="${style}"` : '';
      return `<span class="mg-user"${styleAttr}>${label}</span>`;
    });

    const tips = records.map(r => {
      const uid = String(r.userId ?? '?');
      const label = UserLabel.formatText(uid, userMap.get(uid));
      const time = (r.timems / 1000).toFixed(3);
      const bvs = PBFormat.bvs(r.bv, r.timems);
      const occ = rankMap.get(uid);
      return `${label}\ntime: ${time} s\nbvs: ${bvs}` +
             (typeof occ === 'number' ? `\n出现排名: ${occ}` : '');
    });
    const tip = PBFormat.escapeHtml(`bv ${bv}\n` + tips.join('\n---\n'));

    return `<div class="mg-cell mg-has" title="${tip}">${lines.join('')}</div>`;
  }
}