function loadStats(data) {
  const total = data.length;
  const sum = (key) => data.reduce((s, d) => s + (d[key] || 0), 0);
  const avgTimems = total ? Math.round(sum('timems') / total) : 0;
  const avgCl = total ? (sum('cl') / total).toFixed(1) : 0;

  const topOf = (key) => {
    const c = {};
    data.forEach(d => { if (d[key]) c[d[key]] = (c[d[key]] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0];
  };
  const topSw = topOf('software');
  const topLv = topOf('level');

  const times = data.map(d => d.upload_time).filter(Boolean).sort();
  const range = times.length
    ? `${Utils.fmtDate(times[0])} ~ ${Utils.fmtDate(times[times.length - 1])}`
    : '—';

  const stats = [
    { label: '视频总数', value: total },
    { label: '平均耗时 (ms)', value: avgTimems.toLocaleString() },
    { label: '平均 CL', value: avgCl },
    { label: '最常用软件', value: topSw ? topSw[0] : '—', small: true },
    { label: '最常见等级', value: topLv ? topLv[0] : '—', small: true },
    { label: '时间范围', value: range, small: true },
  ];

  const grid = document.getElementById('statsGrid');
  grid.innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="label">${s.label}</div>
      <div class="value${s.small ? ' small' : ''}">${s.value}</div>
    </div>
  `).join('');
}

if (document.getElementById('statsGrid')) {
  loadPageData(loadStats);
}