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

const SOFT_COLS = [
  { key: 'sp_b',     label: 'b SP', asc: false },
  { key: 'sp_i',     label: 'i SP', asc: false },
  { key: 'sp_e',     label: 'e SP', asc: false },
  { key: 'sp_total', label: '总 SP', asc: false },
];

let fsRows = [];
let fsUserMap = new Map();
let fsSortKey = 'sp_total';
let fsTopN = 5;
let fsNT = null;
let fsWeights = null;

function renderHead() {
  document.getElementById('fsHead').innerHTML = `<tr>
    <th class="col-rank">排名</th>
    <th>用户</th>
    ${FRONTEND_COLS.map(c =>
      `<th class="col-num sortable" data-key="${c.key}" title="${c.name}">${c.label}</th>`
    ).join('')}
    ${SOFT_COLS.map(c =>
      `<th class="col-num sortable" data-key="${c.key}">${c.label}</th>`
    ).join('')}
  </tr>`;
  updateHeadHighlight();
}

function updateHeadHighlight() {
  document.querySelectorAll('#fsHead th.sortable').forEach(th => {
    th.classList.toggle('active', th.dataset.key === fsSortKey);
  });
}

function findCol(key) {
  return FRONTEND_COLS.find(c => c.key === key) ||
         SOFT_COLS.find(c => c.key === key);
}

function fmtValue(v) {
  if (v == null || !isFinite(v)) return '—';
  return v.toFixed(3);
}

function colorFor(key, v) {
  if (v == null || !isFinite(v)) return '';
  const col = FRONTEND_COLS.find(c => c.key === key);
  if (col) return ColorScale.styleFor(v, col.scale);
  // 软实力列：100 → 色阶落点 5
  return ColorScale.styleFor(v / 100 * 5, 'bvs');
}

function enrichRows() {
  if (!fsNT || !fsWeights) return;
  for (const r of fsRows) {
    const sp = SoftPower.computeOne(r, fsNT, fsWeights);
    r.sp_b = sp.b;
    r.sp_i = sp.i;
    r.sp_e = sp.e;
    r.sp_total = sp.total;
  }
}

function renderBody() {
  const col = findCol(fsSortKey) || FRONTEND_COLS[0];
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

    const mainCells = FRONTEND_COLS.map(c => {
      const v = r[c.key];
      const style = colorFor(c.key, v);
      const styleAttr = style ? ` style="${style}"` : '';
      return `<td class="num"${styleAttr}>${fmtValue(v)}</td>`;
    }).join('');

    const softCells = SOFT_COLS.map(c => {
      const v = r[c.key];
      const style = colorFor(c.key, v);
      const styleAttr = style ? ` style="${style}"` : '';
      return `<td class="num"${styleAttr}>${fmtValue(v)}</td>`;
    }).join('');

    return `<tr>
      <td class="medal-rank"${rankAttr}>${i + 1}</td>
      <td><a class="user-link" href="stats.html?user_id=${uid}">${label}</a></td>
      ${mainCells}${softCells}
    </tr>`;
  }).join('');
}

async function loadData() {
  Utils.setStatus('读取缓存...');
  const all = await FrontendScores.getAll();
  fsRows = all.filter(r => r && r.userId != null);
  fsTopN = FrontendScores.getTopN();
  document.getElementById('pageTitle').textContent = `.${fsTopN} 排行`;

  if (!fsRows.length) {
    Utils.setStatus('暂无前端成绩缓存 · 请在「缓存管理」中重算', 'error');
    document.getElementById('fsBody').innerHTML =
      `<tr><td colspan="15" class="medal-empty">暂无数据</td></tr>`;
    return;
  }

  fsNT = FrontendNT.get();
  fsWeights = SoftPower.getWeights();

  if (!fsNT) {
    Utils.setStatus('未生成 NT 锚点，请重算前端成绩', 'warn');
  } else {
    enrichRows();
  }

  Utils.setStatus('拉取用户信息...');
  try {
    const ids = fsRows.map(r => String(r.userId));
    fsUserMap = await UserCache.ensureUsers(ids);
  } catch (e) {
    console.warn('用户信息拉取失败', e);
  }

  renderBody();
  const ntTip = fsNT ? '' : ' · 无 NT';
  Utils.setStatus(`✓ 共 ${fsRows.length} 位用户 · 前 ${fsTopN} 名${ntTip}`, 'success');
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