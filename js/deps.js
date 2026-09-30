window.DEPS = {
  /* 基础 */
  'utils':        'js/utils.js',
  'requestQueue': 'js/requestQueue.js',
  'cacheDb':      'js/cacheDb.js',
  'cache':        { src: 'js/cache.js',  deps: ['cacheDb'] },
  'colorscale':   'js/colorscale.js',
  'api':          { src: 'js/api.js',    deps: ['utils', 'cache', 'requestQueue'] },

  /* PB 基础 */
  'pbFormat':   'js/pb/pbFormat.js',
  'pbWeights':  { src: 'js/pb/pbWeights.js', deps: [] },
  'pbLevel':    { src: 'js/pb/pbLevel.js',   deps: ['pbFormat', 'colorscale'] },
  'pbLevels':   { src: 'js/pb/pbLevels.js',  deps: ['pbLevel'] },
  'pbCache':    { src: 'js/pb/pbCache.js',   deps: ['cacheDb'] },
  'pbRenderer': { src: 'js/pb/pbRenderer.js', deps: ['colorscale', 'pbWeights'] },
  'pbPage':     { src: 'js/pb/pbPage.js',
                  deps: ['utils', 'api', 'pbLevels', 'pbCache', 'pbRenderer'] },

  /* 首页图表 */
  'chartUploadTrend': { src: 'js/charts/uploadTrend.js', deps: ['utils'] },
  'chartSoftware':    { src: 'js/charts/software.js',    deps: ['utils'] },
  'chartLevel':       { src: 'js/charts/level.js',       deps: ['utils'] },
  'chartMode':        { src: 'js/charts/mode.js',        deps: ['utils'] },
  'chartState':       { src: 'js/charts/state.js',       deps: ['utils'] },
  'chartTimems':      { src: 'js/charts/timems.js',      deps: ['utils'] },
  'chartsPage': {
    src: 'js/charts/main.js',
    deps: ['utils', 'api', 'chartUploadTrend', 'chartSoftware',
           'chartLevel', 'chartMode', 'chartState', 'chartTimems'],
  },

  /* 简单页面 */
  'statsCards': { src: 'js/statsCards.js', deps: ['utils'] },
  'pbOverview': { src: 'js/pbOverview.js', deps: [] },
  'statsPage': {
    src: 'js/stats.js',
    deps: ['utils', 'api', 'pbCache',
           'statsCards', 'pbOverview',
           'chartUploadTrend', 'chartSoftware', 'chartLevel',
           'chartMode', 'chartState', 'chartTimems'],
  },
  'tablePage': { src: 'js/table.js', deps: ['utils', 'api'] },
  'settingsPage': {
    src: 'js/settings/settingsPage.js',
    deps: ['pbWeights', 'frontendScores', 'frontendNT', 'softPower'],
  },

  /* 奖牌榜 */
  'medalsRenderer': { src: 'js/medals/medalsRenderer.js',
                      deps: ['utils', 'colorscale', 'pbFormat', 'userLabel'] },
  'medalsPage': {
    src: 'js/medals/medalsPage.js',
    deps: ['utils', 'colorscale', 'pbFormat', 'pbLevels',
           'pbCache', 'medalsRenderer', 'userCache'],
  },

  /* PB 总榜 */
  'pbRankData':     { src: 'js/pbRank/pbRankData.js',
                      deps: ['cacheDb', 'pbWeights'] },
  'pbRankRenderer': { src: 'js/pbRank/pbRankRenderer.js',
                      deps: ['colorscale', 'userLabel', 'pbFormat'] },
  'pbRankPage':     { src: 'js/pbRank/pbRankPage.js',
                      deps: ['utils', 'pbLevels', 'userCache',
                             'pbRankData', 'pbRankRenderer'] },

  /* 奖牌图 */
  'medalGridData':     { src: 'js/medalGrid/medalGridData.js',
                         deps: ['cacheDb'] },
  'medalGridRenderer': { src: 'js/medalGrid/medalGridRenderer.js',
                         deps: ['userLabel', 'pbFormat', 'colorscale'] },
  'medalGridPage':     { src: 'js/medalGrid/medalGridPage.js',
                         deps: ['utils', 'pbLevels', 'userCache',
                                'medalGridData', 'medalGridRenderer'] },

  /* 互啄 */
  'duelLevel':    'js/duel/duelLevel.js',
  'duelLevels':   { src: 'js/duel/duelLevels.js',   deps: ['duelLevel'] },
  'duelGrid':     'js/duel/duelGrid.js',
  'duelRenderer': 'js/duel/duelRenderer.js',
  'duelLoader':   { src: 'js/duel/duelLoader.js',
                    deps: ['api', 'pbCache', 'pbLevels'] },
  'duelPage':     { src: 'js/duel/duelPage.js',
                    deps: ['utils', 'duelLevels', 'duelGrid',
                           'duelLoader', 'duelRenderer'] },

  /* 支撑线（帕累托线） */
  'supportLine':     'js/pb/supportLine.js',
  'supportRenderer': { src: 'js/support/supportRenderer.js', deps: ['utils'] },
  'supportPage': {
    src: 'js/support/supportPage.js',
    deps: ['utils', 'pbLevels', 'pbCache', 'supportLine', 'supportRenderer',
           'userCache', 'userLabel'],
  },

  /* 分档 */
  'tierAlgo':     'js/pareto/tierAlgo.js',
  'tierLoader':   { src: 'js/pareto/tierLoader.js',
                    deps: ['cacheDb', 'pbCache', 'supportLine', 'tierAlgo', 'userCache'] },
  'tierRenderer': { src: 'js/pareto/tierRenderer.js', deps: ['userLabel'] },
  'tierLines':    { src: 'js/pareto/tierLinesRenderer.js', deps: ['utils'] },
  'tierPage':     { src: 'js/pareto/tierPage.js',
                    deps: ['utils', 'colorscale', 'pbLevels', 'pbCache',
                           'supportLine', 'tierLoader', 'tierRenderer', 'tierLines'] },

  /* 前端成绩 */
  'frontendScores': {
    src: 'js/frontend/frontendScores.js',
    deps: ['cacheDb', 'pbLevels', 'pbCache', 'frontendNT'],
  },
  'frontendNT': {
    src: 'js/frontend/frontendNT.js',
    deps: [],
  },
  'softPower': {
    src: 'js/frontend/softPower.js',
    deps: [],
  },
  'frontendRankPage': {
    src: 'js/frontend/frontendRankPage.js',
    deps: ['utils', 'userCache', 'userLabel', 'colorscale',
           'pbLevels', 'pbCache', 'frontendScores',
           'frontendNT', 'softPower'],
  },

  /* 缓存管理 */
  'cacheManager': { src: 'js/cacheManager.js',
                    deps: ['utils', 'cacheDb', 'cache', 'userCache', 'userLabel'] },
  'batchLoader':  { src: 'js/batchLoader.js',  deps: ['utils', 'api', 'cache'] },
  'recalcPBs': {
    src: 'js/recalcPBs.js',
    deps: ['utils', 'pbCache', 'pbLevels', 'supportLine',
           'progressUI', 'frontendScores', 'frontendNT'],
  },

  /* 用户信息缓存 */
  'userApi':     { src: 'js/userApi.js',     deps: ['requestQueue'] },
  'userCache': { src: 'js/userCache.js', deps: ['cacheDb', 'userApi'] },
  'userLabel':   { src: 'js/userLabel.js',   deps: [] },

  /* 公共进度 UI */
  'progressUI': { src: 'js/progressUI.js', deps: [] },

  /* 缓存管理页的 UI 脚本 */
  'recalcPBs': {
    src: 'js/recalcPBs.js',
    deps: ['utils', 'pbCache', 'pbLevels', 'supportLine',
           'progressUI', 'frontendScores', 'frontendNT'],
  },
  'userSyncUI': { src: 'js/userSyncUI.js',
                  deps: ['utils', 'userCache', 'progressUI'] },
};