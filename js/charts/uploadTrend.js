function renderUploadTrend(data, store) {
  const byDay = {};
  data.forEach(d => {
    if (!d.upload_time) return;
    const day = d.upload_time.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  });
  const labels = Object.keys(byDay).sort();
  const values = labels.map(l => byDay[l]);

  Utils.chart('chartUploadTrend', 'line', {
    labels,
    datasets: [{
      label: '上传数量',
      data: values,
      borderColor: '#58a6ff',
      backgroundColor: 'rgba(88,166,255,0.12)',
      fill: true, tension: 0.35,
      pointRadius: 3, pointBackgroundColor: '#58a6ff', borderWidth: 2,
    }]
  }, {
    scales: {
      x: { ticks: { color: '#8b949e', maxTicksLimit: 12, font: { size: 10 } }, grid: { color: '#21262d' } },
      y: { beginAtZero: true, ticks: { color: '#8b949e', stepSize: 1, font: { size: 10 } }, grid: { color: '#21262d' } }
    },
    plugins: { legend: { display: false } }
  }, store);
}