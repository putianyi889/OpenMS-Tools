const pbRenderer = new PBRenderer(PB_LEVELS);

if (document.getElementById('pbContent')) {
  loadPageData(data => {
    pbRenderer.renderAll(document.getElementById('pbContent'), data);
  });
}