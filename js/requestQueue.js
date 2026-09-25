/**
 * 全局请求队列：串行执行任务，相邻两次任务完成时间差 ≥ 1 秒。
 */
const RequestQueue = (() => {
  const INTERVAL = 1000;
  let lastAt = 0;
  let tail = Promise.resolve();

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
    tail = next.catch(() => {});
    return next;
  }

  function stats() {
    return { interval: INTERVAL, lastAt };
  }

  return { enqueue, stats, INTERVAL };
})();