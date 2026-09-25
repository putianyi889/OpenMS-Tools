function renderTimems(data, store) {
  const times = data.map(d => d.timems).filter(t => typeof t === 'number' && t > 0);

  if (times.length === 0) {
    Utils.chart('chartTimems', 'bar',
      { labels: ['无数据'], datasets: [{ data: [0], backgroundColor: ['#30363d'] }] },
      { plugins: { legend: { display: false } } }, store);
    return;
  }

  const min = Math.min(...times);
  const max = Math.max(...times);
  const binCount = Math.min(20, Math.max(5, Math.ceil(Math.sqrt(times.length))));
  const binWidth = (max - min) / binCount || 1;
  const bins = new Array(binCount).fill(0);

  times.forEach(t => {
    let idx = Math.floor((t - min) / binWidth);
    if (idx >= binCount) idx = binCount - 1;
    bins[idx]++;
  });

  const labels = bins.map((_, i) => {
    const lo = Math.round(min + i * binWidth);
    const hi = Math.round(min + (i + 1) * binWidth);
    return `${lo}~${hi}`;
  });

  Utils.chart('chartTimems', 'bar', {
    labels,
    datasets: [{
      label: '视频数', data: bins,
      backgroundColor: 'rgba(188,140,255,0.7)',
      borderColor: '#bc8cff', borderWidth: 1, borderRadius: 3,
    }]
  }, {
    scales: {
      x: { ticks: { color: '#8b949e', font: { size: 9 }, maxRotation: 45 }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { color: '#8b949e', stepSize: 1, font: { size: 10 } }, grid: { color: '#21262d' } }
    },
    plugins: { legend: { display: false } }
  }, store);
}