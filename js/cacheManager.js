async function refreshList() {
  const status = document.getElementById('status');
  const tbody = document.getElementById('cacheTableBody');
  const empty = document.getElementById('emptyState');
  const summary = document.getElementById('summary');

  status.textContent = '读取中...';
  status.className = 'status';

  const items = await Cache.list();

  if (!items.length) {
    tbody.innerHTML = '';
    summary.innerHTML = '';
    empty.style.display = 'block';
    status.textContent = '暂无缓存';
    return;
  }

  const totalCount = items.reduce((s, i) => s + i.count, 0);
  const totalSize = items.reduce((s, i) => s + i.size, 0);

  summary.innerHTML = `
    <div class="stat-card">
      <div class="label">缓存条目</div>
      <div class="value">${items.length}</div>
    </div>
    <div class="stat-card">
      <div class="label">视频总数</div>
      <div class="value">${totalCount.toLocaleString()}</div>
    </div>
    <div class="stat-card">
      <div class="label">占用空间</div>
      <div class="value">${Cache.fmtSize(totalSize)}</div>
    </div>
  `;

  // 拉取用户 realname（缓存命中则零网络）
  const ids = items.map(it => String(it.userId));
  let userMap = new Map();
  try {
    userMap = await UserCache.ensureUsers(ids, p => {
      if (p.phase === 'fetch' && p.total) {
        status.textContent = `拉取用户信息 ${p.done}/${p.total}...`;
      }
    });
  } catch (e) {
    console.warn('用户信息拉取失败，使用 #id 兜底', e);
  }

  tbody.innerHTML = items.map(it => {
    const uid = String(it.userId);
    const label = UserLabel.format(uid, userMap.get(uid));
    return `
    <tr>
      <td><a class="btn-link" href="stats.html?user_id=${uid}">${label}</a></td>
      <td>${it.count.toLocaleString()}</td>
      <td>${Cache.fmtSize(it.size)}</td>
      <td>
        ${Utils.fmtDateTime(new Date(it.ts).toISOString())}
        <br><span class="muted">${Cache.ageText(it.age)}</span>
      </td>
      <td class="actions">
        <a class="btn-link" href="stats.html?user_id=${uid}">查看</a>
        <a class="btn-link warn" href="stats.html?user_id=${uid}&refresh=1">刷新</a>
        <button class="btn-link danger" onclick="removeOne('${uid}')">删除</button>
      </td>
    </tr>
  `;
  }).join('');

  empty.style.display = 'none';
  status.textContent = `已加载 ${items.length} 条缓存记录`;
  status.className = 'status success';
}

async function removeOne(userId) {
  if (!confirm(`确定删除用户 ${userId} 的缓存？`)) return;
  await Cache.remove(userId);
  await refreshList();
}

async function clearAllCaches() {
  if (!confirm('确定清空所有缓存？此操作不可撤销。')) return;
  await Cache.clearAll();
  await refreshList();
}

/* 首次进入页面时自动刷新 */
if (document.getElementById('cacheTable')) {
  refreshList();
}