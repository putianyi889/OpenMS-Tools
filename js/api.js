async function fetchVideos(userId) {
  return RequestQueue.enqueue(() => doFetchVideos(userId));
}

async function doFetchVideos(userId) {
  const url = `https://openms.top/api/userprofile/videolist?user_id=${userId}`;
  const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  const data = await resp.json();
  if (!Array.isArray(data)) throw new Error('返回数据格式异常，预期为数组');
  return data;
}

// loadPageData 保持原样，内部调用 fetchVideos 会自动走队列
async function loadPageData(onLoaded) {
  const userId = Utils.getUserId();
  if (!userId || isNaN(userId) || Number(userId) < 1) {
    Utils.setStatus('缺少有效的 user_id 参数，请从导航页重新进入', 'error');
    return;
  }

  const params = new URLSearchParams(location.search);
  const force = params.get('refresh') === '1';
  if (force) {
    params.delete('refresh');
    history.replaceState(null, '', location.pathname + '?' + params.toString());
  }

  if (!force) {
    const cached = await Cache.read(userId);
    if (cached) {
      Utils.setStatus(
        `⚡ 来自缓存 · ${cached.data.length} 条 · 缓存于 ${Cache.ageText(cached.age)}`,
        'success'
      );
      onLoaded(cached.data);
      return;
    }
  }

  Utils.setStatus('加载中...');
  try {
    const data = await fetchVideos(userId);
    await Cache.write(userId, data);
    Utils.setStatus(`✓ 已从服务器加载 ${data.length} 条记录`, 'success');
    onLoaded(data);
  } catch (err) {
    console.error('加载失败:', err);
    if (force) {
      const cached = await Cache.read(userId);
      if (cached) {
        Utils.setStatus(
          `⚠ 刷新失败，继续使用原有缓存（${cached.data.length} 条 · ${Cache.ageText(cached.age)}）`,
          'error'
        );
        onLoaded(cached.data);
        return;
      }
    }
    Utils.setStatus(`加载失败: ${err.message}`, 'error');
  }
}