export class AdapterRegistry {
  #adapters = new Map();

  register(adapter) {
    if (!adapter?.id || typeof adapter.probe !== 'function') {
      throw new TypeError('Adapter requires id and probe()');
    }
    this.#adapters.set(adapter.id, adapter);
    return adapter;
  }

  get(id) {
    return this.#adapters.get(id) || null;
  }

  list() {
    return [...this.#adapters.values()].map(({ id, kind, capabilities = [] }) => ({ id, kind, capabilities }));
  }

  async probe(id, target) {
    const adapter = this.get(id);
    if (!adapter) throw new Error(`Unknown adapter: ${id}`);
    const started = performance.now();
    try {
      const result = await adapter.probe(target);
      return {
        adapterId: id,
        targetId: target.id,
        measuredAt: new Date().toISOString(),
        latencyMs: Math.round(performance.now() - started),
        trust: 'OBSERVED',
        ...result
      };
    } catch (error) {
      return {
        adapterId: id,
        targetId: target.id,
        measuredAt: new Date().toISOString(),
        latencyMs: Math.round(performance.now() - started),
        trust: 'OBSERVED',
        status: navigator.onLine ? 'DEGRADED' : 'OFFLINE',
        detail: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export function isFresh(observation, maxAgeMs) {
  if (!observation?.measuredAt) return false;
  return Date.now() - new Date(observation.measuredAt).getTime() <= maxAgeMs;
}
