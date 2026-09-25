class DuelRenderer {
  constructor(levels) {
    this.levels = levels;
  }

  renderAll(hostPBs, guestPBs) {
    const results = this.levels.map(level => ({
      level,
      result: level.computeDuelFromPBs(hostPBs, guestPBs),
    }));

    this.renderSummary(results);
    document.getElementById('duelContent').innerHTML =
      results.map(r => this.renderSection(r.level, r.result)).join('');
  }

  renderSummary(results) {
    const hostTotal  = results.reduce((s, r) => s + r.result.hostTotal, 0);
    const guestTotal = results.reduce((s, r) => s + r.result.guestTotal, 0);
    document.getElementById('duelSummary').innerHTML = `
      <div class="duel-summary">
        <div class="duel-summary-title">总分 PK</div>
        ${this.renderPkBar(hostTotal, guestTotal, 'large')}
      </div>
    `;
  }

  renderSection(level, result) {
    return `
      <section class="duel-section">
        <h2 class="duel-title">
          ${level.label} 级
          <span class="duel-sub">bv ${level.minBv}–${level.maxBv}</span>
        </h2>
        ${this.renderPkBar(result.hostTotal, result.guestTotal)}
        ${DuelGrid.render(level, result.slots)}
      </section>
    `;
  }

  renderPkBar(hostScore, guestScore, size = '') {
    const total = hostScore + guestScore;
    const hostPct = total > 0 ? (hostScore / total) * 100 : 50;
    const guestPct = 100 - hostPct;
    return `
      <div class="duel-pk ${size ? 'duel-pk-' + size : ''}">
        <div class="duel-pk-host" style="width:${hostPct.toFixed(2)}%"></div>
        <div class="duel-pk-guest" style="width:${guestPct.toFixed(2)}%"></div>
        <div class="duel-pk-scores">
          <span>${hostScore.toFixed(2)}</span>
          <span>${guestScore.toFixed(2)}</span>
        </div>
      </div>
    `;
  }
}