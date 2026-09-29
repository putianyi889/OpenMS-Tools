const FRONTEND_COLS = [
  { key: 'bt', label: 'bt', asc: true,  scale: 'b_time', name: 'b · time' },
  { key: 'bb', label: 'bb', asc: false, scale: 'bvs',    name: 'b · bvs'  },
  { key: 'bs', label: 'bs', asc: false, scale: 'stnb',   name: 'b · stnb' },
  { key: 'it', label: 'it', asc: true,  scale: 'i_time', name: 'i · time' },
  { key: 'ib', label: 'ib', asc: false, scale: 'bvs',    name: 'i · bvs'  },
  { key: 'is', label: 'is', asc: false, scale: 'stnb',   name: 'i · stnb' },
  { key: 'et', label: 'et', asc: true,  scale: 'e_time', name: 'e · time' },
  { key: 'eb', label: 'eb', asc: false, scale: 'bvs',    name: 'e · bvs'  },
  { key: 'es', label: 'es', asc: false, scale: 'stnb',   name: 'e · stnb' },
];

let fsRows = [];
let fsUserMap = new Map();
let fsSortKey = 'bt';
const fsTopN = { value: 5 };

function renderHead() {
  document.getElementById('fsHead').innerHTML = `<tr>
    <th class="col-rank">排名</th>
    <th>用户</th>
    ${FRONTEND_COLS.map(c =>
      `<th class="col-num sortable" data-key="${c.key}" title="${c.name}">${c.label}</th>`
    ).join('')}
  </tr>`;
  updateHeadHighlight();
}

function updateHeadHighlight() {
  document.querySelectorAll('#fsHead th.sortable').forEach(th => {
    th.classList.toggle('active', th.dataset.key === fsSortKey);
  });
}

function fmtCol(col, v) {
  if (v == null || !isFinite(v)) return '—';
  return v.toFixed(3);
}

function colorCol(col, v) {
  if (v == null || !isFinite(v)) return '';
  return ColorScale.styleFor(v, col.scale);
}

function renderBody() {
  const col = FRONTEND_COLS.find(c => c.key === fsSortKey) || FRONTEND_COLS[0];
  const sorted = [...fsRows].sort((a, b) => {
    const va = a[col.key], vb = b[col.key];
    const aNull = va == null || !isFinite(va);
    const bNull = vb == null || !isFinite(vb);
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    return col.asc ? va - vb : vb - va;
  });

  document.getElementById('fsBody').innerHTML = sorted.map((r, i) => {
    const uid = String(r.userId);
    const label = UserLabel.format(uid, fsUserMap.get(uid));
    const rankStyle = ColorScale.styleFor(i + 1, 'rank');
    const rankAttr = rankStyle ? ` style="${rankStyle}"` : '';

    const cells = FRONTEND_COLS.map(c => {
      const v = r[c.key];
      const style = colorCol(c, v);
      const styleAttr = style ? ` style="${style}"` : '';
      return `<td class="num"${styleAttr}>${fmtCol(c, v)}</td>`;
    }).join('');

    return `<tr>
      <td class="medal-rank"${rankAttr}>${i + 1}</td>
      <td><a class="user-link" href="stats.html?user_id=${uid}">${label}</a></td>
      ${cells}
    </tr>`;
  }).join('');
}

async function loadData() {
  Utils.setStatus('读取缓存...');
  const all = await FrontendScores.getAll();
  fsRows = all.filter(r => r && r.userId != null);
  fsTopN.value = FrontendScores.getTopN();
  document.getElementById('pageTitle').textContent = `.${fsTopN.value} 排行`;

  if (!fsRows.length) {
    Utils.setStatus(
      `暂无前端成绩缓存 · 请在「缓存管理」中重算，或调整「设置」里的 N`,
      'error'
    );
    document.getElementById('fsBody').innerHTML =
      `<tr><td colspan="11" class="medal-empty">暂无数据</td></tr>`;
    return;
  }

  Utils.setStatus('拉取用户信息...');
  try {
    const ids = fsRows.map(r => String(r.userId));
    fsUserMap = await UserCache.ensureUsers(ids);
  } catch (e) {
    console.warn('用户信息拉取失败', e);
  }

  renderBody();
  Utils.setStatus(`✓ 共 ${fsRows.length} 位用户 · 前 ${fsTopN.value} 名`, 'success');
}

function onHeadClick(e) {
  const th = e.target.closest('th.sortable');
  if (!th) return;
  const key = th.dataset.key;
  if (key === fsSortKey) return;
  fsSortKey = key;
  updateHeadHighlight();
  renderBody();
}

if (document.getElementById('fsTable')) {
  renderHead();
  document.getElementById('fsHead').addEventListener('click', onHeadClick);
  loadData();
}