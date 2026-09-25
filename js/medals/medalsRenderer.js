/** 奖牌榜的行渲染。相同 timems 共享同一名次；数值列应用色阶。 */
const MedalsRenderer = {
  render(records, level) {
    const tbody = document.getElementById('medalBody');
    if (!records.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="medal-empty">
        暂无缓存的 PB · 请先访问 PB 页面或批量加载用户
      </td></tr>`;
      return;
    }

    let prevTimems = null;
    let rank = 0;
    const timeScale = `${level.key}_time`;

    tbody.innerHTML = records.map((r, i) => {
      if (r.timems !== prevTimems) rank = i + 1;
      prevTimems = r.timems;

      const timeSec = r.timems / 1000;
      const bvsVal = r.bv / timeSec;
      const stnbVal = level.stnbC * r.bv / Math.pow(timeSec, 1.7);

      const t = PBFormat.time(r.timems);
      const bvs = PBFormat.bvs(r.bv, r.timems);
      const s = PBFormat.stnb(level.stnbC, r.bv, r.timems);
      const upload = Utils.fmtDateTime(r.upload_time);

      const uid = PBFormat.escapeHtml(r.userId ?? '?');
      const name = PBFormat.escapeHtml(r.player ?? '未知');

      const rankStyle  = ColorScale.styleFor(rank, 'rank');
      const timeStyle  = ColorScale.styleFor(timeSec, timeScale);
      const bvsStyle   = ColorScale.styleFor(bvsVal, 'bvs');
      const stnbStyle  = ColorScale.styleFor(stnbVal, 'stnb');

      const sc = (s) => s ? ` style="${s}"` : '';

      return `<tr>
        <td class="medal-rank"${sc(rankStyle)}>${this.medalIcon(rank)}</td>
        <td>
          <a class="user-link" href="stats.html?user_id=${uid}">#${uid}</a>
          <span class="user-name">${name}</span>
        </td>
        <td class="num"${sc(timeStyle)}>${PBFormat.escapeHtml(t)}</td>
        <td class="num"${sc(bvsStyle)}>${PBFormat.escapeHtml(bvs)}</td>
        <td class="num"${sc(stnbStyle)}>${PBFormat.escapeHtml(s)}</td>
        <td>${PBFormat.escapeHtml(upload)}</td>
      </tr>`;
    }).join('');
  },

  medalIcon(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return String(rank);
  },
};