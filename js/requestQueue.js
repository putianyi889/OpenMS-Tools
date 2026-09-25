/**
 * 全局请求队列：串行执行任务，相邻两次任务之间的开始时间差 ≥ INTERVAL 毫秒。
 * 调用方应只在"真正要发网络请求"时入队；缓存命中请直接返回，不要占用配额。
 */
const RequestQueue = (() => {
  const INTERVAL = 1000;
  let lastAt = 0;             // 上一次任务完成的时刻
  let tail = Promise.resolve(); // 队列尾

  function enqueue(task) {
    const next = tail.then(async () => {
      const wait = Math.max(0, INTERVAL - (Date.now() - lastAt));
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      try {
        return await task();
      } finally {
        lastAt = Date.now();
      }
    });
    // tail 只追踪"完成"，不传递结果和异常，避免一次失败卡死后续请求
    tail = next.catch(() => {});
    return next;
  }

  function stats() {
    return { interval: INTERVAL, lastAt, pending: tail };
  }

  return { enqueue, stats, INTERVAL };
})();