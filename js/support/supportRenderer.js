const SupportRenderer = (() => {
  const charts = {}; // canvasId → Chart

  function clear(canvasId) {
    if (charts[canvasId]) {
      charts[canvasId].destroy();
      delete charts[canvasId];
    }
  }

  /**
   * @param {string} canvasId
   * @param {Array<{label:string, points:Array<{timems:number,bvs:number}>}>} seriesList
   */
  function render(canvasId, seriesList) {
    clear(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors = Utils.palette(seriesList.length);

    charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: seriesList.map((s, i) => {
          const isMerged = s.isMerged === true;
          const color = isMerged ? '#f0c674' : colors[i];
          return {
            label: s.label,
            data: s.points.map(p => ({ x: p.timems, y: p.bvs })),
            borderColor: color,
            backgroundColor: color,
            borderWidth: isMerged ? 3 : 2,
            pointRadius: isMerged ? 5 : 3,
            pointHoverRadius: isMerged ? 7 : 5,
            pointBackgroundColor: color,
            tension: 0.15,
            fill: false,
            order: isMerged ? -1 : 0,
          };
        }),
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
          legend: {
            labels: { color: '#8b949e', font: { size: 11 }, boxWidth: 12 },
          },
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

  /** 显示/隐藏某图的空状态提示 */
  function setEmpty(canvasId, isEmpty) {
    const levelKey = canvasId.replace(/^chart-/, '');
    const el = document.getElementById(`empty-${levelKey}`);
    if (el) el.style.display = isEmpty ? 'flex' : 'none';
  }

  return { render, clear, setEmpty };
})();