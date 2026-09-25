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

  renderGrid(level, pbMap) {
    const cells = [];

    cells.push(`<div class="pb-corner"></div>`);
    for (let ones = 0; ones <= 9; ones++) {
      cells.push(`<div class="pb-col-label">${ones}</div>`);
    }

    for (let tens = 0; tens <= level.maxTens; tens++) {
      cells.push(`<div class="pb-row-label">${tens}</div>`);
      for (let ones = 0; ones <= 9; ones++) {
        const bv = tens * 10 + ones;
        cells.push(level.renderCell(bv, pbMap.get(bv)));
      }
    }

    return `<div class="pb-grid">${cells.join('')}</div>`;
  }
}