const duelRenderer = new DuelRenderer(DUEL_LEVELS);

function startDuel() {
  const u1 = document.getElementById('user1').value.trim();
  const u2 = document.getElementById('user2').value.trim();
  if (!isValidUserId(u1) || !isValidUserId(u2)) {
    alert('请输入两个有效的用户 ID');
    return;
  }
  if (u1 === u2) {
    alert('两个用户 ID 不能相同');
    return;
  }
  location.href = `duel.html?user1=${u1}&user2=${u2}`;
}

async function initDuelPage() {
  const params = new URLSearchParams(location.search);
  const id1 = params.get('user1');
  const id2 = params.get('user2');

  if (!isValidUserId(id1) || !isValidUserId(id2)) {
    document.getElementById('duelForm').style.display = 'block';
    return;
  }

  document.getElementById('duelForm').style.display = 'none';
  Utils.setStatus('加载中...');
  try {
    const { id1: h, id2: g, data1, data2 } = await loadDuelData();
    Utils.setStatus(`✓ 主方 #${h}（${data1.length} 条） vs 客方 #${g}（${data2.length} 条）`, 'success');
    duelRenderer.renderAll(data1, data2);
  } catch (err) {
    console.error(err);
    Utils.setStatus(`加载失败: ${err.message}`, 'error');
  }
}

if (document.getElementById('duelContent')) {
  initDuelPage();
}