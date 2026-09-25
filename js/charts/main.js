const charts = {};

function renderAllCharts(data) {
  renderUploadTrend(data, charts);
  renderSoftware(data, charts);
  renderLevel(data, charts);
  renderMode(data, charts);
  renderState(data, charts);
  renderTimems(data, charts);
}

if (document.getElementById('chartUploadTrend')) {
  loadPageData(renderAllCharts);
}