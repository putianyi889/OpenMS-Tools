const PBRankRenderer = (() => {
  function render(tbodyId, rows, level, sortKey, userMap, hasWeights) {
    const col = PBRankData.COLS.find(c => c.key === sortKey) || PBRankData.COLS[0];
    const sorted = [...rows].sort((a, b) => {
      const va = a[col.key], vb = b[col.key];
      if (!isFinite(va) && !isFinite(vb)) return 0;
      if (!isFinite(va)) return 1;
      if (!isFinite(vb)) return -1;
      return col.dir === 'asc' ? va - vb : vb - va;
    });

    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = sorted.map((s, i) => {
      const uid = String(s.userId);
      const label = UserLabel.format(uid, userMap.get(uid));
      const rankStyle = ColorScale.styleFor(i + 1, 'rank');

      const cells = PBRankData.COLS.map(c => {
        const v = s[c.key];
        const display = displayValue(c, v, hasWeights);
        const style = colorFor(c, v, level, hasWeights);
        const styleAttr = style ? ` style="${style}"` : '';
        return `<td class="num"${styleAttr}>${display}</td>`;
      }).join('');

      const rankAttr = rankStyle ? ` style="${rankStyle}"` : '';
      return `<tr>
        <td class="medal-rank"${rankAttr}>${i + 1}</td>
        <td><a class="user-link" href="stats.html?user_id=${uid}">${label}</a></td>
        ${cells}
      </tr>`;
    }).join('');
  }

  function displayValue(col, v, hasWeights) {
    if (col.key === 'pbCount') return v;
    if (col.key.startsWith('avg') && !hasWeights) return '—';
    if (!isFinite(v)) return '—';
    if (col.scale === 'rank') return v.toFixed(4);
    return v.toFixed(3);
  }

  function colorFor(col, v, level, hasWeights) {
    if (!col.scale) return '';
    if (col.key.startsWith('avg') && !hasWeights) return '';
    if (!isFinite(v)) return '';

    const bvCount = level.maxBv - level.minBv + 1;
    const isSum = col.key.startsWith('sum');

    if (col.scale === 'time') {
      const c = isSum ? v / bvCount : v;
      return ColorScale.styleFor(c, `${level.key}_time`);
    }
    if (col.scale === 'bvs' || col.scale === 'stnb') {
      if (v === 0) return '';
      const c = isSum ? v / bvCount : v;
      return ColorScale.styleFor(c, col.scale);
    }
    if (col.scale === 'rank') {
      if (v <= 0) return '';
      const c = isSum ? bvCount / v : 1 / v;
      return ColorScale.styleFor(c, 'rank');
    }
    return '';
  }

  return { render };
})();