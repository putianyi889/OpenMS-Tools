/** 网格渲染：行内按 主胜 → 主独占 → 平局/皆无 → 客独占 → 客胜 重排 */
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

    const hostWin   = row.filter(s => s.status === 'host').sort(this.byBv);
    const hostOnly  = row.filter(s => s.status === 'host_only').sort(this.byBv);
    const mid       = row.filter(s => s.status === 'both' || s.status === 'empty').sort(this.byBv);
    const guestOnly = row.filter(s => s.status === 'guest_only').sort(this.byBv);
    const guestWin  = row.filter(s => s.status === 'guest').sort(this.byBv);

    return [...hostWin, ...hostOnly, ...mid, ...guestOnly, ...guestWin]
      .map(s => this.renderCell(s)).join('');
  },

  byBv(a, b) { return a.bv - b.bv; },

  renderCell(slot) {
    const { bv, status, hostPB, guestPB } = slot;
    const lines = [`bv ${bv}`];
    if (hostPB) lines.push(`主方: ${hostPB.timems} ms`);
    if (guestPB) lines.push(`客方: ${guestPB.timems} ms`);
    if (status === 'host_only' || status === 'guest_only') lines.push('（独占）');
    const tip = DuelGrid.escape(lines.join('\n'));
    return `<div class="duel-cell duel-${status}" title="${tip}">${bv}</div>`;
  },

  escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },
};