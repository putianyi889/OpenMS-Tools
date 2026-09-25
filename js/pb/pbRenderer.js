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

    // 表头行：空角 + 列号 0-9
    cells.push(`<div class="pb-corner"></div>`);
    for (let ones = 0; ones <= 9; ones++) {
      cells.push(`<div class="pb-col-label">${ones}</div>`);
    }

    // 数据行：行号（十位）+ 10 个单元格
    for (let tens = 0; tens <= level.maxTens; tens++) {
      cells.push(`<div class="pb-row-label">${tens}</div>`);
      for (let ones = 0; ones <= 9; ones++) {
        const bv = tens * 10 + ones;
        cells.push(this.renderCell(level, bv, pbMap.get(bv)));
      }
    }

    return `<div class="pb-grid">${cells.join('')}</div>`;
  }

  renderCell(level, bv, pb) {
    const inRange = bv >= level.minBv && bv <= level.maxBv;
    if (!inRange) return `<div class="pb-cell pb-empty"></div>`;

    if (!pb) {
      return `<div class="pb-cell pb-missing" title="bv ${bv} · 无记录">—</div>`;
    }
    const text = level.getCellText(pb);
    const tip = this.escape(level.getCellTooltip(bv, pb));
    return `<div class="pb-cell pb-has" title="${tip}">${text}</div>`;
  }

  escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
}