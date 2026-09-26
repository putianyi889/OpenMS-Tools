const PBOverview = (() => {
  let chart = null;

  function render(pbs) {
    const canvas = document.getElementById('chartPB');
    if (!canvas) return;
    if (chart) { chart.destroy(); chart = null; }

    const levelKeys = ['b', 'i', 'e'];
    const labels = ['B 级', 'I 级', 'E 级'];
    const pbCounts = levelKeys.map(k => pbs.filter(r => r.level === k).length);
    const supportCounts = levelKeys.map(k =>
      pbs.filter(r => r.level === k && r.support === true).length);

    chart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'PB 数', data: pbCounts, backgroundColor: '#58a6ff', borderRadius: 4 },
          { label: '支撑线点', data: supportCounts, backgroundColor: '#f0c674', borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#8b949e', font: { size: 11 } }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: '#8b949e', stepSize: 5, font: { size: 10 } },
               grid: { color: '#21262d' } },
        },
        plugins: { legend: { labels: { color: '#8b949e', font: { size: 11 }, boxWidth: 12 } } },
      },
    });
  }

  return { render };
})();