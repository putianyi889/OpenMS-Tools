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
    const overall = this.computeStats(level, pbMap);
    const statText = `Σ ${this.fmt(overall.sum)} · x̄ ${overall.configured ? this.fmt(overall.avg) : '—'}`;

    return `
      <section class="pb-section">
        <h2 class="pb-title">
          ${level.label} 级
          <span class="pb-sub">bv ${level.minBv}–${level.maxBv} · 共 ${pbMap.size} 个 PB</span>
          <span class="pb-overview">${statText}</span>
        </h2>
        ${this.renderGrid(level, pbMap)}
      </section>
    `;
  }

  /** tens === undefined 时统计整级；否则统计一行（10 个 bv） */
  computeStats(level, pbMap, tens) {
    let sum = 0, ws = 0, wt = 0;
    const start = tens === undefined ? level.minBv : tens * 10;
    const end = tens === undefined
      ? level.maxBv
      : Math.min(tens * 10 + 9, level.maxBv);

    for (let bv = start; bv <= end; bv++) {
      if (bv < level.minBv || bv > level.maxBv) continue;
      const pb = pbMap.get(bv);
      const v = level.getValueForStat(bv, pb);
      const w = PBWeights.get(level.key, bv);
      sum += v;
      ws += v * w;
      wt += w;
    }
    return { sum, avg: wt > 0 ? ws / wt : 0, configured: wt > 0 };
  }

  fmt(v) {
    if (!isFinite(v)) return '—';
    return v.toFixed(3);
  }

  computeRowRange(pbMap) {
    let minTens = Infinity, maxTens = -Infinity;
    for (const bv of pbMap.keys()) {
      const tens = Math.floor(bv / 10);
      if (tens < minTens) minTens = tens;
      if (tens > maxTens) maxTens = tens;
    }
    return minTens === Infinity ? null : [minTens, maxTens];
  }

  renderGrid(level, pbMap) {
    const range = this.computeRowRange(pbMap);
    if (!range) return `<div class="pb-grid-empty">该等级暂无 PB 记录</div>`;

    const [minTens, maxTens] = range;
    const cells = [];

    cells.push(`<div class="pb-corner"></div>`);
    for (let ones = 0; ones <= 9; ones++) {
      cells.push(`<div class="pb-col-label">${ones}</div>`);
    }
    cells.push(`<div class="pb-col-label pb-col-stat">Σ</div>`);
    cells.push(`<div class="pb-col-label pb-col-stat">x̄</div>`);

    for (let tens = minTens; tens <= maxTens; tens++) {
      cells.push(`<div class="pb-row-label">${tens}</div>`);
      for (let ones = 0; ones <= 9; ones++) {
        cells.push(level.renderCell(tens * 10 + ones, pbMap.get(tens * 10 + ones)));
      }
      const { sum, avg, configured } = this.computeStats(level, pbMap, tens);
      cells.push(this.renderStatCell(sum, level, 'sum'));
      cells.push(this.renderStatCell(avg, level, 'avg', configured));
    }

    return `<div class="pb-grid">${cells.join('')}</div>`;
  }

  renderStatCell(value, level, type, configured = true) {
    if (type === 'avg' && !configured) {
      return `<div class="pb-cell pb-stat pb-stat-missing">—</div>`;
    }
    const text = this.fmt(value);

    // 取色值：
    //  1) sum 列先除以 10 归一为"平均"（原有逻辑）
    //  2) rank 模式下，Σ/x̄ 存的是 1/rank 的和/平均，方向与其他模式相反，
    //     取倒数恢复成"等价 rank"，才能对齐 rank 色阶阈值
    let colorValue = value;
    if (type === 'sum') colorValue = value / 10;
    if (level.displayMode === 'rank') {
      colorValue = colorValue > 0 ? 1 / colorValue : Infinity;
    }

    const style = ColorScale.styleFor(colorValue, level.getScaleName());
    const styleAttr = style ? ` style="${style}"` : '';
    return `<div class="pb-cell pb-stat pb-stat-${type}"${styleAttr}>${text}</div>`;
  }
}