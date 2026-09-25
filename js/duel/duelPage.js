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

  // 显示"排队中"提示：如果 400ms 还没到第一个进度点，说明在等待队列
  let queueHint = setTimeout(() => {
    Utils.setStatus('排队中，网络请求间隔 1 秒...', '');
  }, 400);

  try {
    const { id1: h, id2: g, data1, data2 } = await loadDuelData((i, total, uid) => {
      clearTimeout(queueHint);
      Utils.setStatus(`已加载 ${i}/${total}（用户 #${uid}）`);
      queueHint = setTimeout(() => {
        Utils.setStatus(`等待下一个请求（间隔 1 秒）...`);
      }, 400);
    });
    clearTimeout(queueHint);
    Utils.setStatus(
      `✓ 主方 #${h}（${data1.length} 条） vs 客方 #${g}（${data2.length} 条）`,
      'success'
    );
    duelRenderer.renderAll(data1, data2);
  } catch (err) {
    clearTimeout(queueHint);
    console.error(err);
    Utils.setStatus(`加载失败: ${err.message}`, 'error');
  }
}

if (document.getElementById('duelContent')) {
  initDuelPage();
}