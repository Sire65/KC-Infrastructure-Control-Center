const AUTHORITATIVE_TRUST=new Set(['OBSERVED','OBSERVED_REMOTE']);

export function resourceMaxAge(resource, adapters, fallbackMs = 90_000) {
  const policy = resource?.adapterId ? adapters.policy(resource.adapterId, resource) : {};
  return policy.maxAgeMs ?? resource?.maxAgeMs ?? fallbackMs;
}

export function isAuthoritativeResource(resource){
  return AUTHORITATIVE_TRUST.has(resource?.trust);
}

export function normalizedResourceStatus(resource, adapters, isFreshFn, fallbackMs = 90_000) {
  const maxAgeMs = resourceMaxAge(resource, adapters, fallbackMs);
  if (!isFreshFn(resource, maxAgeMs)) return 'UNKNOWN';
  if (resource?.requiredForOverall && !isAuthoritativeResource(resource)) return 'UNKNOWN';
  return resource.status || 'UNKNOWN';
}

export function evaluateSystemHealth(resources, { adapters, isFreshFn, fallbackMs = 90_000 } = {}) {
  const rows = resources.map(resource => ({
    resource,
    authoritative:isAuthoritativeResource(resource),
    status: normalizedResourceStatus(resource, adapters, isFreshFn, fallbackMs)
  }));
  const required = rows.filter(x => x.resource.requiredForOverall);
  const scope = required.length ? required : rows;
  const states = scope.map(x => x.status);

  if (!scope.length) return { status: 'UNKNOWN', coverage: 0, required: 0, unknownRequired: 0, authoritativeRequired:0 };
  const result={coverage:coverage(scope),required:scope.length,unknownRequired:states.filter(s=>s==='UNKNOWN').length,authoritativeRequired:scope.filter(x=>x.authoritative).length};
  if (states.some(s => s === 'FAILED' || s === 'OFFLINE')) return { status: 'FAILED', ...result };
  if (states.some(s => s === 'DEGRADED')) return { status: 'DEGRADED', ...result };
  if (states.some(s => s === 'UNKNOWN')) return { status: 'UNKNOWN', ...result };
  return { status: states.every(s => s === 'HEALTHY' || s === 'ONLINE') ? 'HEALTHY' : 'UNKNOWN', ...result };
}

function coverage(rows) {
  if (!rows.length) return 0;
  const known = rows.filter(x => x.status !== 'UNKNOWN' && (!x.resource.requiredForOverall || x.authoritative)).length;
  return Math.round((known / rows.length) * 100);
}
