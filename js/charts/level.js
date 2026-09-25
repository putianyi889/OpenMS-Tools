function renderLevel(data, store) {
  const counts = {};
  data.forEach(d => {
    if (d.level) counts[d.level] = (counts[d.level] || 0) + 1;
  });
  const labels = Object.keys(counts).sort();
  const values = labels.map(l => counts[l]);
  const colors = Utils.palette(labels.length);

  Utils.chart('chartLevel', 'bar', {
    labels,
    datasets: [{
      label: '数量', data: values,
      backgroundColor: colors, borderRadius: 4, borderSkipped: false,
    }]
  }, {
    scales: {
      x: { ticks: { color: '#8b949e', font: { size: 10 } }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { color: '#8b949e', stepSize: 1, font: { size: 10 } }, grid: { color: '#21262d' } }
    },
    plugins: { legend: { display: false } }
  }, store);
}