export const PROGRAM_FLOW_SCHEMA='kicc.program-flow.v1';
export const PROGRAM_FLOW_MAX_AGE_MS=120_000;
export const PROGRAM_FLOW_FUTURE_TOLERANCE_MS=15_000;
const TYPES=new Set(['HEARTBEAT','READ','WRITE','SYNC','PUSH','EMAIL','SMS','WHATSAPP','BACKUP','RESTORE','API','OTHER']);
const STATUS=new Set(['OK','DEGRADED','FAILED','UNKNOWN']);
const DIRECTIONS=new Set(['OUTBOUND','INBOUND','BIDIRECTIONAL','UNKNOWN']);
const clean=(v,max=160)=>typeof v==='string'?v.trim().slice(0,max):'';
const metric=v=>Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;

export function normalizeProgramFlow(input,now=Date.now()){
  if(!input||typeof input!=='object')throw new Error('flow object required');
  const programId=clean(input.programId,100);if(!programId)throw new Error('programId required');
  const from=clean(input.from||`program:${programId}`,140);if(!from)throw new Error('from required');
  const to=clean(input.to,140);if(!to)throw new Error('to required');
  const measured=new Date(input.measuredAt||now),measuredMs=measured.getTime();if(!Number.isFinite(measuredMs))throw new Error('invalid measuredAt');
  if(measuredMs>now+PROGRAM_FLOW_FUTURE_TOLERANCE_MS)throw new Error('measuredAt too far in future');
  const type=TYPES.has(String(input.type||'').toUpperCase())?String(input.type).toUpperCase():'OTHER';
  const status=STATUS.has(String(input.status||'').toUpperCase())?String(input.status).toUpperCase():'UNKNOWN';
  const direction=DIRECTIONS.has(String(input.direction||'').toUpperCase())?String(input.direction).toUpperCase():'UNKNOWN';
  return Object.freeze({
    schema:PROGRAM_FLOW_SCHEMA,
    eventId:clean(input.eventId||`${programId}:${measuredMs}:${Math.random().toString(36).slice(2,8)}`,180),
    correlationId:clean(input.correlationId,180)||null,
    programId,
    instanceId:clean(input.instanceId||input.deviceId||'browser',120),
    from,
    to,
    type,
    dataClass:clean(input.dataClass,100)||null,
    transport:clean(input.transport,80)||null,
    direction,
    role:clean(input.role,80)||null,
    status,
    count:metric(input.count),
    bytes:metric(input.bytes),
    recordsPerSecond:metric(input.recordsPerSecond),
    bytesPerSecond:metric(input.bytesPerSecond),
    queueDepth:metric(input.queueDepth),
    syncLagMs:metric(input.syncLagMs),
    latencyMs:metric(input.latencyMs),
    measuredAt:measured.toISOString(),
    source:clean(input.source||'PROGRAM_FLOW',80),
    trust:clean(input.trust||'SELF_REPORTED',80),
    message:clean(input.message,240)
  });
}
