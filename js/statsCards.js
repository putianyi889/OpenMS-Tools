const StatsCards = (() => {
  function render(data, pbs) {
    const total = data.length;
    const times = data.map(d => d.upload_time).filter(Boolean).sort();
    const span = times.length
      ? `${Utils.fmtDate(times[0])} ~ ${Utils.fmtDate(times[times.length - 1])}`
      : '—';

    const levels = new Set();
    const softwares = new Set();
    const modes = new Set();
    for (const d of data) {
      if (d.level) levels.add(String(d.level).toLowerCase());
      if (d.software) softwares.add(d.software);
      if (d.mode) modes.add(d.mode);
    }

    const levelLabel = ['b', 'i', 'e']
      .filter(k => levels.has(k))
      .map(k => k.toUpperCase())
      .join(' / ') || '—';

    const pbTotal = pbs.length;
    const supportTotal = pbs.filter(r => r.support).length;

    const cards = [
      { label: '视频总数', value: total.toLocaleString() },
      { label: '时间跨度', value: span, small: true },
      { label: '参与等级', value: levelLabel },
      { label: '独立软件', value: softwares.size },
      { label: '独立模式', value: modes.size },
      { label: 'PB / 支撑点', value: pbTotal
          ? `${pbTotal.toLocaleString()} / ${supportTotal.toLocaleString()}`
          : '—',
        small: pbTotal > 0 },
    ];

    document.getElementById('statsGrid').innerHTML = cards.map(c => `
      <div class="stat-card">
        <div class="label">${c.label}</div>
        <div class="value${c.small ? ' small' : ''}">${c.value}</div>
      </div>
    `).join('');
  }

  return { render };
})();