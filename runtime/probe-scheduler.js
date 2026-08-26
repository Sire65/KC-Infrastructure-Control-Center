export class ProbeScheduler {
  #lastAttempt = new Map();

  isDue(target, adapters, now = Date.now()) {
    if (!target?.adapterId) return false;
    const policy = adapters.policy(target.adapterId, target);
    const refreshMs = policy.refreshMs ?? 60_000;
    const last = this.#lastAttempt.get(target.id) ?? 0;
    return now - last >= refreshMs;
  }

  markAttempt(targetId, now = Date.now()) {
    this.#lastAttempt.set(targetId, now);
  }

  dueTargets(targets, adapters, now = Date.now()) {
    return targets.filter(target => this.isDue(target, adapters, now));
  }

  reset(targetId = null) {
    if (targetId) this.#lastAttempt.delete(targetId);
    else this.#lastAttempt.clear();
  }
}
