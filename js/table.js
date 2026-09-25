let tableData = [];
let sortField = 'id';
let sortAsc = true;

function renderTable(data) {
  const sorted = [...data].sort((a, b) => {
    let va = a[sortField], vb = b[sortField];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  document.querySelector('#dataTable tbody').innerHTML = sorted.map(d => `
    <tr>
      <td>${d.id ?? '—'}</td>
      <td>${d.player ?? '—'}</td>
      <td>${d.software ?? '—'}</td>
      <td>${d.level ?? '—'}</td>
      <td>${d.mode ?? '—'}</td>
      <td>${d.state ?? '—'}</td>
      <td>${d.cl ?? '—'}</td>
      <td>${d.ce ?? '—'}</td>
      <td>${d.timems != null ? d.timems.toLocaleString() : '—'}</td>
      <td>${d.bv ?? '—'}</td>
      <td>${Utils.fmtDateTime(d.upload_time)}</td>
      <td>${Utils.fmtDateTime(d.end_time)}</td>
    </tr>
  `).join('');

  document.getElementById('tableCount').textContent = `(共 ${data.length} 条)`;
}

function sortTable(field) {
  if (sortField === field) sortAsc = !sortAsc;
  else { sortField = field; sortAsc = true; }
  renderTable(tableData);
}

if (document.getElementById('dataTable')) {
  loadPageData(data => {
    tableData = data;
    renderTable(data);
  });
}