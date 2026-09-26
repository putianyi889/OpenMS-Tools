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
  'pbLevel':    { src: 'js/pb/pbLevel.js',   deps: ['pbFormat', 'colorscale'] },
  'pbLevels':   { src: 'js/pb/pbLevels.js',  deps: ['pbLevel'] },
  'pbCache':    { src: 'js/pb/pbCache.js',   deps: ['cacheDb'] },
  'pbRenderer': 'js/pb/pbRenderer.js',
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
  'statsPage': { src: 'js/stats.js', deps: ['utils', 'api'] },
  'tablePage': { src: 'js/table.js', deps: ['utils', 'api'] },

  /* 奖牌榜 */
  'medalsRenderer': { src: 'js/medals/medalsRenderer.js',
                      deps: ['utils', 'colorscale', 'pbFormat', 'userLabel'] },
  'medalsPage':     { src: 'js/medals/medalsPage.js',
                      deps: ['utils', 'colorscale', 'pbFormat', 'pbLevels',
                             'pbCache', 'medalsRenderer', 'userCache'] },
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

  /* 缓存管理 */
  'cacheManager': { src: 'js/cacheManager.js', deps: ['utils', 'cacheDb', 'cache'] },
  'batchLoader':  { src: 'js/batchLoader.js',  deps: ['utils', 'api', 'cache'] },
  'recalcPBs':    { src: 'js/recalcPBs.js',
                    deps: ['utils', 'pbCache', 'pbLevels', 'supportLine'] },

  /* 用户信息缓存 */
  'userCacheDb': { src: 'js/userCacheDb.js', deps: [] },
  'userApi':     { src: 'js/userApi.js',     deps: ['requestQueue'] },
  'userCache':   { src: 'js/userCache.js',   deps: ['userCacheDb', 'userApi'] },
  'userLabel':   { src: 'js/userLabel.js',   deps: [] },

  /* 公共进度 UI */
  'progressUI': { src: 'js/progressUI.js', deps: [] },

  /* 缓存管理页的 UI 脚本 */
  'recalcPBs':  { src: 'js/recalcPBs.js',
                  deps: ['utils', 'pbCache', 'pbLevels', 'supportLine', 'progressUI'] },
  'userSyncUI': { src: 'js/userSyncUI.js',
                  deps: ['utils', 'userCache', 'progressUI'] },
};