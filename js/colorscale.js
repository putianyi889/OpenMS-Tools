/**
 * 数值色阶：根据数值返回背景色 + 文字颜色。
 * 色阶 = colors（比 thresholds 多 1 个）+ thresholds（递增或递减）。
 * 端点规则：值等于阈值时，归到索引更小端点相邻的区间（即包含该端点）。
 */
const ColorScale = (() => {
  /* ---------------- 色阶定义 ---------------- */

  const BVS_THRESHOLDS = [
    0.01,
    0.5, 1, 1.5, 2,
    2.25, 2.5, 2.75, 3,
    3.25, 3.5, 3.75, 4,
    4.25, 4.5, 4.75, 5,
    5.25, 5.5, 5.75, 6,
    6.25, 6.5, 6.75, 7,
    7.25, 7.5, 7.75, 8,
  ];
  const STNB_THRESHOLDS = BVS_THRESHOLDS.map(v => v * 25);

  const B_TIME_THRESHOLDS = BVS_THRESHOLDS.map(v => 12 - v * 2).toReversed();
  const I_TIME_THRESHOLDS = BVS_THRESHOLDS.map(v => 30 - v * 4).toReversed();
  const E_TIME_THRESHOLDS = BVS_THRESHOLDS.map(v => 90 - v * 10).toReversed();

  const RANK_THRESHOLDS = [100, 30, 10, 3, 2, 1];

  const COLORS_BASE = [
    'rgba(255,255,255,0)',
    '#808080', '#595959', '#AE78D6', '#7030A0',
    '#FF5B5B', '#FFA7A7', '#FF0000', '#BC0000',
    '#92D050', '#B2DE82', '#00B050', '#009242',
    '#00B0F0', '#81DEFF', '#0070C0', '#005696',
    '#FFC000', '#FFE07D', '#E7831D', '#A65C12',
    '#FF57B7', '#FF97D2', '#D6007B', '#A2005D',
    '#14D2A0', '#7DF3D4', '#0F9D78', '#0B7B5E',
    '#CCFF66',
  ];
  const COLORS_TIME = COLORS_BASE.toReversed();
  const COLORS_RANK = [
    'rgba(255,255,255,0)', // > 100
    '#595959',             // 31–100
    '#81DEFF',             // 11–30
    '#92D050',             // 4–10
    '#d29922',             // 3
    '#c9d1d9',             // 2
    '#f0c674',             // 1
  ];

  const SCALES = {
    bvs:    { colors: COLORS_BASE, thresholds: BVS_THRESHOLDS },
    stnb:   { colors: COLORS_BASE, thresholds: STNB_THRESHOLDS },
    b_time: { colors: COLORS_TIME, thresholds: B_TIME_THRESHOLDS },
    i_time: { colors: COLORS_TIME, thresholds: I_TIME_THRESHOLDS },
    e_time: { colors: COLORS_TIME, thresholds: E_TIME_THRESHOLDS },
    rank:   { colors: COLORS_RANK, thresholds: RANK_THRESHOLDS },
  };

  /* ---------------- 区间查找 ---------------- */

  /** 值落在哪个区间索引（0..N） */
  function findIndex(value, thresholds) {
    const N = thresholds.length;
    if (!N) return 0;
    const asc = thresholds[0] < thresholds[N - 1];
    if (asc) {
      for (let i = 0; i < N; i++) if (value < thresholds[i]) return i;
      return N;
    }
    for (let i = 0; i < N; i++) if (value > thresholds[i]) return i;
    return N;
  }

  /* ---------------- 颜色工具 ---------------- */

  function parseColor(c) {
    if (!c) return null;
    if (c[0] === '#') {
      const hex = c.slice(1);
      if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
          a: 1,
        };
      }
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
          a: 1,
        };
      }
    }
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(',').map(s => s.trim());
      return {
        r: parseFloat(p[0]), g: parseFloat(p[1]), b: parseFloat(p[2]),
        a: p[3] != null ? parseFloat(p[3]) : 1,
      };
    }
    return null;
  }

  function luminance({ r, g, b }) {
    const toLin = v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  }

  const BG = { r: 0x16, g: 0x1b, b: 0x22 }; // 页面底色，用于 alpha 合成

  function fgFor(colorStr) {
    const p = parseColor(colorStr);
    if (!p) return '#e1e4e8';
    const r = p.r * p.a + BG.r * (1 - p.a);
    const g = p.g * p.a + BG.g * (1 - p.a);
    const b = p.b * p.a + BG.b * (1 - p.a);
    const lum = luminance({ r, g, b });
    const cBlack = (lum + 0.05) / 0.05;
    const cWhite = 1.05 / (lum + 0.05);
    return cBlack >= cWhite ? '#000' : '#fff';
  }

  /* ---------------- 对外 API ---------------- */

  function resolve(value, scaleName) {
    const scale = SCALES[scaleName];
    if (!scale || typeof value !== 'number' || !isFinite(value)) {
      return { bg: '', fg: '' };
    }
    const idx = findIndex(value, scale.thresholds);
    const bg = scale.colors[idx] || '';
    return { bg, fg: fgFor(bg) };
  }

  /**
   * 返回可直接放进 style 的字符串；数值无效或背景全透明时返回 ''（不覆盖任何样式）。
   */
  function styleFor(value, scaleName) {
    const { bg, fg } = resolve(value, scaleName);
    if (!bg) return '';
    const p = parseColor(bg);
    if (p && p.a === 0) return '';
    return `background:${bg};color:${fg};`;
  }

  return { SCALES, findIndex, resolve, styleFor };
})();