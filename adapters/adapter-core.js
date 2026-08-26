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
    return [...this.#adapters.values()].map(({ id, kind, capabilities = [], refreshMs = null, maxAgeMs = null }) => ({ id, kind, capabilities, refreshMs, maxAgeMs }));
  }

  policy(id, target = {}) {
    const adapter = this.get(id);
    if (!adapter) return { refreshMs: target.refreshMs ?? null, maxAgeMs: target.maxAgeMs ?? null };
    return {
      refreshMs: target.refreshMs ?? adapter.refreshMs ?? null,
      maxAgeMs: target.maxAgeMs ?? adapter.maxAgeMs ?? null
    };
  }

  async probe(id, target) {
    const adapter = this.get(id);
    if (!adapter) throw new Error(`Unknown adapter: ${id}`);
    const now = () => globalThis.performance?.now?.() ?? Date.now();
    const started = now();
    try {
      const result = await adapter.probe(target);
      return {
        adapterId: id,
        targetId: target.id,
        measuredAt: new Date().toISOString(),
        latencyMs: Math.round(now() - started),
        trust: 'OBSERVED',
        ...result
      };
    } catch (error) {
      const online = globalThis.navigator?.onLine;
      return {
        adapterId: id,
        targetId: target.id,
        measuredAt: new Date().toISOString(),
        latencyMs: Math.round(now() - started),
        trust: 'OBSERVED',
        status: online === false ? 'OFFLINE' : 'DEGRADED',
        detail: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export function isFresh(observation, maxAgeMs) {
  if (!observation?.measuredAt || !Number.isFinite(maxAgeMs) || maxAgeMs <= 0) return false;
  const measured = new Date(observation.measuredAt).getTime();
  if (!Number.isFinite(measured)) return false;
  return Date.now() - measured <= maxAgeMs;
}
