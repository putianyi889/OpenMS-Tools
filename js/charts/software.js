function renderSoftware(data, store) {
  const counts = {};
  data.forEach(d => {
    if (d.software) counts[d.software] = (counts[d.software] || 0) + 1;
  });
  const labels = Object.keys(counts);
  const values = labels.map(l => counts[l]);
  const colors = Utils.palette(labels.length);

  Utils.chart('chartSoftware', 'doughnut', {
    labels,
    datasets: [{
      data: values, backgroundColor: colors,
      borderColor: '#161b22', borderWidth: 2
    }]
  }, {
    plugins: {
      legend: { position: 'bottom', labels: { color: '#8b949e', font: { size: 11 }, padding: 12 } }
    },
    cutout: '55%'
  }, store);
}