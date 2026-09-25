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

  const phaseLabel = { videos: '视频', pbs: 'PB' };
  try {
    const { id1: h, id2: g, pbs1, pbs2, videos1, videos2 } =
      await loadDuelData((i, total, uid, phase) => {
        Utils.setStatus(
          `${i}/${total} · 用户 #${uid} · 加载${phaseLabel[phase] || phase}`
        );
      });
    Utils.setStatus(
      `✓ 主方 #${h}（${videos1.length} 视频 / ${pbs1.length} PB） vs ` +
      `客方 #${g}（${videos2.length} 视频 / ${pbs2.length} PB）`,
      'success'
    );
    duelRenderer.renderAll(pbs1, pbs2);
  } catch (err) {
    console.error(err);
    Utils.setStatus(`加载失败: ${err.message}`, 'error');
  }
}

if (document.getElementById('duelContent')) {
  initDuelPage();
}