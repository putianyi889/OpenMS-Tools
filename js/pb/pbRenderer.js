class PBRenderer {
  constructor(levels) {
    this.levels = levels;
  }

  renderAll(container, videos) {
    container.innerHTML = this.levels
      .map(lv => this.renderSection(lv, videos))
      .join('');
  }

  renderSection(level, videos) {
    const pbMap = level.computePB(videos);
    return `
      <section class="pb-section">
        <h2 class="pb-title">
          ${level.label} 级
          <span class="pb-sub">bv ${level.minBv}–${level.maxBv} · 共 ${pbMap.size} 个 PB</span>
        </h2>
        ${this.renderGrid(level, pbMap)}
      </section>
    `;
  }

  /**
   * 计算有 PB 的十位范围（仅裁剪首尾空行，中间空行保留）。
   * @returns {[number, number]|null} [minTens, maxTens]，无 PB 时返回 null
   */
  computeRowRange(pbMap) {
    let minTens = Infinity;
    let maxTens = -Infinity;
    for (const bv of pbMap.keys()) {
      const tens = Math.floor(bv / 10);
      if (tens < minTens) minTens = tens;
      if (tens > maxTens) maxTens = tens;
    }
    return minTens === Infinity ? null : [minTens, maxTens];
  }

  renderGrid(level, pbMap) {
    const range = this.computeRowRange(pbMap);

    if (!range) {
      return `<div class="pb-grid-empty">该等级暂无 PB 记录</div>`;
    }

    const [minTens, maxTens] = range;
    const cells = [];

    // 表头行
    cells.push(`<div class="pb-corner"></div>`);
    for (let ones = 0; ones <= 9; ones++) {
      cells.push(`<div class="pb-col-label">${ones}</div>`);
    }

    // 只渲染 [minTens, maxTens] 区间内的数据行
    for (let tens = minTens; tens <= maxTens; tens++) {
      cells.push(`<div class="pb-row-label">${tens}</div>`);
      for (let ones = 0; ones <= 9; ones++) {
        const bv = tens * 10 + ones;
        cells.push(level.renderCell(bv, pbMap.get(bv)));
      }
    }

    return `<div class="pb-grid">${cells.join('')}</div>`;
  }
}