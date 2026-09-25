async function loadDuelData(onProgress) {
  const params = new URLSearchParams(location.search);
  const id1 = params.get('user1');
  const id2 = params.get('user2');

  if (!isValidUserId(id1)) throw new Error('缺少有效的 user1 参数');
  if (!isValidUserId(id2)) throw new Error('缺少有效的 user2 参数');
  if (String(id1) === String(id2)) throw new Error('两个用户 ID 不能相同');

  // 1. 确保 videos 已缓存
  const videos1 = await getOrFetchVideos(id1);
  onProgress && onProgress(1, 4, id1, 'videos');
  const videos2 = await getOrFetchVideos(id2);
  onProgress && onProgress(2, 4, id2, 'videos');

  // 2. 确保 pbs 已缓存（无则从 videos 计算并写入）
  const pbs1 = await ensurePBs(id1, videos1);
  onProgress && onProgress(3, 4, id1, 'pbs');
  const pbs2 = await ensurePBs(id2, videos2);
  onProgress && onProgress(4, 4, id2, 'pbs');

  return { id1, id2, pbs1, pbs2, videos1, videos2 };
}

function isValidUserId(id) {
  return id && !isNaN(id) && Number(id) >= 1;
}

async function getOrFetchVideos(userId) {
  const cached = await Cache.read(userId);
  if (cached) return cached.data;
  const data = await fetchVideos(userId);
  await Cache.write(userId, data);
  return data;
}

/** 若 pbs 已有该用户记录则直接用；否则从 videos 计算并写入 */
async function ensurePBs(userId, videos) {
  const existing = await PBCache.getByUser(userId);
  if (existing.length > 0) return existing;
  await PBCache.writeFromVideos(userId, videos, PB_LEVELS);
  return await PBCache.getByUser(userId);
}