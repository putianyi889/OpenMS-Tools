const TierRenderer = (() => {
  function render(container, groups, pointsByUser, levelKey, onToggle) {
    if (!groups.size) {
      container.innerHTML =
        `<div class="tier-empty">暂无分档数据（可能尚未重算支撑线）</div>`;
      return;
    }

    const tiers = [...groups.keys()].sort((a, b) => a - b);
    container.innerHTML = tiers
      .map(t => renderTier(t, groups.get(t)))
      .join('');

    container.addEventListener('change', e => {
      const cb = e.target;
      if (!cb.matches('input[type="checkbox"]')) return;
      const key = cb.dataset.lineKey;
      const checked = cb.checked;
      container
        .querySelectorAll(`input[data-line-key="${key}"]`)
        .forEach(other => { other.checked = checked; });
      onToggle(key, checked);
    });
  }

  function renderTier(tier, subMap) {
    const total = [...subMap.values()].reduce((s, a) => s + a.length, 0);
    const subs = [...subMap.keys()].sort((a, b) => a - b);
    const tierKey = `${tier}-1`;

    const subHtml = subs.map(st =>
      renderSubtier(tier, st, subMap.get(st))
    ).join('');

    return `
      <div class="tier">
        <label class="tier-header">
          <input type="checkbox" data-line-key="${tierKey}">
          <span class="tier-title">Tier ${tier}</span>
          <span class="tier-count">共 ${total} 人</span>
        </label>
        <div class="tier-body">${subHtml}</div>
      </div>
    `;
  }

  function renderSubtier(tier, st, userIds) {
    const key = `${tier}-${st}`;
    const cards = userIds
      .map(uid => `<a class="user-card" href="stats.html?user_id=${uid}">#${uid}</a>`)
      .join('');
    return `
      <div class="subtier">
        <label class="subtier-header">
          <input type="checkbox" data-line-key="${key}">
          <span class="subtier-title">${key}</span>
          <span class="subtier-count">${userIds.length} 人</span>
        </label>
        <div class="user-cards">${cards}</div>
      </div>
    `;
  }

  return { render };
})();