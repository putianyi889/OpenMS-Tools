const PBWeights = (() => {
  const PREFIX = 'openms_pb_weights_';
  const LEVELS = ['b', 'i', 'e'];

  function keyOf(levelKey) { return PREFIX + levelKey; }

  /** 读取某等级的权重数组；未配置返回 null */
  function getArray(levelKey) {
    if (!LEVELS.includes(levelKey)) return null;
    try {
      const s = localStorage.getItem(keyOf(levelKey));
      if (!s) return null;
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr : null;
    } catch { return null; }
  }

  /** 取某等级某 bv 的权重；未配置或无效返回 0 */
  function get(levelKey, bv) {
    const arr = getArray(levelKey);
    if (!arr) return 0;
    const v = arr[bv];
    return typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0;
  }

  /** 从 JSON 文本保存某等级的权重 */
  function setFromJson(levelKey, text) {
    if (!LEVELS.includes(levelKey)) throw new Error('未知等级: ' + levelKey);
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) throw new Error('必须是数组');
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (typeof v !== 'number' || !isFinite(v) || v < 0) {
        throw new Error(`索引 ${i} 不是有效的非负数`);
      }
    }
    localStorage.setItem(keyOf(levelKey), JSON.stringify(arr));
  }

  function clear(levelKey) {
    if (LEVELS.includes(levelKey)) localStorage.removeItem(keyOf(levelKey));
  }

  function clearAll() { LEVELS.forEach(clear); }

  function isConfigured(levelKey) { return getArray(levelKey) !== null; }

  /** 汇总信息（长度 / 非零项 / 总和），用于设置页显示 */
  function summary(levelKey) {
    const arr = getArray(levelKey);
    if (!arr) return null;
    const valid = arr.slice(1).filter(v => typeof v === 'number' && isFinite(v) && v > 0);
    const sum = valid.reduce((s, v) => s + v, 0);
    return { length: arr.length, nonZero: valid.length, sum };
  }

  return { get, getArray, setFromJson, clear, clearAll, isConfigured, summary, LEVELS };
})();