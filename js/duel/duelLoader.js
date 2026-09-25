async function loadDuelData() {
  const params = new URLSearchParams(location.search);
  const id1 = params.get('user1');
  const id2 = params.get('user2');

  if (!isValidUserId(id1)) throw new Error('缺少有效的 user1 参数');
  if (!isValidUserId(id2)) throw new Error('缺少有效的 user2 参数');
  if (String(id1) === String(id2)) throw new Error('两个用户 ID 不能相同');

  const [data1, data2] = await Promise.all([getOrFetch(id1), getOrFetch(id2)]);
  return { id1, id2, data1, data2 };
}

function isValidUserId(id) {
  return id && !isNaN(id) && Number(id) >= 1;
}

async function getOrFetch(userId) {
  const cached = await Cache.read(userId);
  if (cached) return cached.data;
  const data = await fetchVideos(userId);
  await Cache.write(userId, data);
  return data;
}