/** 网格渲染：每行内按 主 → 中（平局 + 空）→ 客 重新排序 */
const DuelGrid = {
  render(level, slots) {
    const range = level.computeRowRange(slots);
    if (!range) return `<div class="duel-grid-empty">该等级暂无互啄记录</div>`;

    const [minTens, maxTens] = range;
    const cells = [];
    for (let tens = minTens; tens <= maxTens; tens++) {
      cells.push(`<div class="duel-row-label">${tens}</div>`);
      cells.push(this.renderRow(tens, slots));
    }
    return `<div class="duel-grid">${cells.join('')}</div>`;
  },

  renderRow(tens, slots) {
    const row = [];
    for (let ones = 0; ones <= 9; ones++) {
      const bv = tens * 10 + ones;
      row.push(slots.get(bv) || { bv, status: 'empty', hostPB: null, guestPB: null });
    }

    const host  = row.filter(s => s.status === 'host').sort(this.byBv);
    const both  = row.filter(s => s.status === 'both').sort(this.byBv);
    const empty = row.filter(s => s.status === 'empty').sort(this.byBv);
    const guest = row.filter(s => s.status === 'guest').sort(this.byBv);

    return [...host, ...both, ...empty, ...guest]
      .map(s => this.renderCell(s)).join('');
  },

  byBv(a, b) { return a.bv - b.bv; },

  renderCell(slot) {
    const { bv, status, hostPB, guestPB } = slot;
    const lines = [`bv ${bv}`];
    if (hostPB) lines.push(`主方: ${hostPB.timems} ms`);
    if (guestPB) lines.push(`客方: ${guestPB.timems} ms`);
    const tip = DuelGrid.escape(lines.join('\n'));
    return `<div class="duel-cell duel-${status}" title="${tip}">${bv}</div>`;
  },

  escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },
};