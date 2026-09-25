const TierLinesRenderer = (() => {
  let chart = null;

  function clear() {
    if (chart) { chart.destroy(); chart = null; }
  }

  function setEmpty(isEmpty) {
    const el = document.getElementById('chartEmpty');
    if (el) el.style.display = isEmpty ? 'flex' : 'none';
  }

  function render(canvasId, seriesList) {
    clear();
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors = Utils.palette(seriesList.length);

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: seriesList.map((s, i) => ({
          label: s.label,
          data: s.points.map(p => ({ x: p.timems, y: p.bvs })),
          borderColor: colors[i],
          backgroundColor: colors[i],
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: colors[i],
          tension: 0.15,
          fill: false,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        animation: false,
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'timems', color: '#8b949e' },
            ticks: { color: '#8b949e', font: { size: 10 } },
            grid: { color: '#21262d' },
          },
          y: {
            type: 'linear',
            title: { display: true, text: 'bvs', color: '#8b949e' },
            ticks: { color: '#8b949e', font: { size: 10 } },
            grid: { color: '#21262d' },
          },
        },
        plugins: {
          legend: { labels: { color: '#8b949e', font: { size: 11 }, boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: c => {
                const { x, y } = c.parsed;
                return `${c.dataset.label}: timems=${Math.round(x)}, bvs=${y.toFixed(3)}`;
              },
            },
          },
        },
      },
    });
  }

  return { render, clear, setEmpty };
})();