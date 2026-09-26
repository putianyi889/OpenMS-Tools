const statsCharts = {};

function renderStatsCharts(data) {
  renderUploadTrend(data, statsCharts);
  renderSoftware(data, statsCharts);
  renderLevel(data, statsCharts);
  renderMode(data, statsCharts);
  renderState(data, statsCharts);
  renderTimems(data, statsCharts);
}

if (document.getElementById('statsGrid')) {
  loadPageData(async data => {
    const uid = Utils.getUserId();
    let pbs = [];
    try { pbs = await PBCache.getByUser(uid); } catch (e) { /* 无 PB 缓存 */ }

    StatsCards.render(data, pbs);
    renderStatsCharts(data);
    PBOverview.render(pbs);
  });
}