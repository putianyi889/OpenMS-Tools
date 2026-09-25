/** 三个等级的实例；stnbC 为 STNB 公式的系数。 */
const PB_LEVELS = [
  new PBLevel({ key: 'b', label: 'B', minBv: 1, maxBv: 54,  stnbC: 36  }),
  new PBLevel({ key: 'i', label: 'I', minBv: 1, maxBv: 216, stnbC: 162 }),
  new PBLevel({ key: 'e', label: 'E', minBv: 1, maxBv: 381, stnbC: 435 }),
];