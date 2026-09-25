async function renderSupport() {
  const userInput = document.getElementById('userIds').value.trim();
  const showMerged = document.getElementById('showMerged').checked;

  if (!userInput) {
    Utils.setStatus('请输入至少一个用户 ID', 'error');
    SUPPORT_LEVEL_KEYS.forEach(k => {
      SupportRenderer.clear(`chart-${k}`);
      SupportRenderer.setEmpty(`chart-${k}`, true);
    });
    return;
  }

  const ids = [...new Set(userInput.split(',').map(s => s.trim()).filter(Boolean))];
  Utils.setStatus('加载中...');

  const p = new URLSearchParams();
  p.set('users', ids.join(','));
  if (!showMerged) p.set('merged', '0');
  history.replaceState(null, '', location.pathname + '?' + p.toString());

  let totalDrawn = 0, totalPoints = 0;

  for (const levelKey of SUPPORT_LEVEL_KEYS) {
    const perUserPoints = [];
    const seriesList = [];

    for (const id of ids) {
      try {
        const points = await PBCache.getSupportLine(id, levelKey);
        if (!points.length) continue;
        perUserPoints.push(points);
        seriesList.push({ userId: id, label: `#${id}`, points });
      } catch (e) {
        console.warn(`用户 ${id} · ${levelKey} 读取失败`, e);
      }
    }

    if (showMerged && perUserPoints.length) {
      const merged = computeMergedSupportLine(perUserPoints);
      if (merged.length) {
        seriesList.push({
          userId: '__merged__',
          label: `合并（${perUserPoints.length} 用户）`,
          points: merged,
          isMerged: true,
        });
      }
    }

    const canvasId = `chart-${levelKey}`;
    if (!seriesList.length) {
      SupportRenderer.clear(canvasId);
      SupportRenderer.setEmpty(canvasId, true);
    } else {
      SupportRenderer.setEmpty(canvasId, false);
      SupportRenderer.render(canvasId, seriesList);
      totalDrawn += seriesList.length;
      totalPoints += seriesList.reduce((s, x) => s + x.points.length, 0);
    }
  }

  if (totalDrawn === 0) {
    Utils.setStatus('没有可用的支撑线数据（可能尚未重算支撑线）', 'error');
    return;
  }

  Utils.setStatus(
    `✓ 已绘制 ${totalDrawn} 条线（共 ${totalPoints} 个点）` +
    (showMerged ? ' · 含合并线' : ''),
    'success'
  );
}

if (document.getElementById('chart-i')) {
  const p = new URLSearchParams(location.search);
  const input = document.getElementById('userIds');
  const checkbox = document.getElementById('showMerged');

  input.value = p.get('users') || '';
  if (p.get('merged') === '0') checkbox.checked = false;

  // 复选框变化 → 立即重绘（前提是已有用户 ID）
  checkbox.addEventListener('change', () => {
    if (input.value.trim()) renderSupport();
  });

  // 顺手让回车也能触发
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') renderSupport();
  });

  if (p.get('users')) renderSupport();
}