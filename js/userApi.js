/** 批量获取用户信息：GET /api/userprofile/infobulk?ids=1,2,3 */
async function fetchUserInfoBulk(ids) {
  return RequestQueue.enqueue(async () => {
    const url = `https://openms.top/api/userprofile/infobulk?ids=${ids.join(',')}`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    const data = await resp.json();
    if (!Array.isArray(data)) throw new Error('返回数据格式异常，预期为数组');
    return data;
  });
}

/** 获取自 since 时间点后更新过的用户 ID：GET /api/userprofile/infoupdated?since=1234567890 */
async function fetchUserInfoUpdated(since) {
  return RequestQueue.enqueue(async () => {
    const url = `https://openms.top/api/userprofile/infoupdated?since=${since}`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    const data = await resp.json();
    if (!Array.isArray(data)) throw new Error('返回数据格式异常，预期为数组');
    return data;
  });
}