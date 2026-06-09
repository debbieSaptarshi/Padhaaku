export function createTrace(requestId) {
  const stages = {};
  const startedAt = performance.now();

  return {
    requestId,
    stage(name, fn) {
      const t0 = performance.now();
      try {
        const result = fn();
        stages[name] = { ms: Math.round(performance.now() - t0), ok: true };
        return result;
      } catch (err) {
        stages[name] = { ms: Math.round(performance.now() - t0), ok: false };
        throw err;
      }
    },
    async stageAsync(name, fn) {
      const t0 = performance.now();
      try {
        const result = await fn();
        stages[name] = { ms: Math.round(performance.now() - t0), ok: true };
        return result;
      } catch (err) {
        stages[name] = { ms: Math.round(performance.now() - t0), ok: false };
        throw err;
      }
    },
    getStages() {
      return stages;
    },
    totalMs() {
      return Math.round(performance.now() - startedAt);
    },
    log(event, extra = {}) {
      if (process.env.RAG_LOG_LEVEL === "silent") return;
      console.log(
        JSON.stringify({
          event,
          requestId,
          ...extra,
          stages,
          totalMs: this.totalMs(),
        })
      );
    },
  };
}
