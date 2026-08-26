export const PROGRAM_HEARTBEAT_SCHEMA='kicc.program-heartbeat.v1';
export const PROGRAM_HEARTBEAT_MAX_AGE_MS=90_000;
const STATUS=new Set(['ONLINE','DEGRADED','OFFLINE','UNKNOWN','MAINTENANCE']);
const clean=(v,max=160)=>typeof v==='string'?v.trim().slice(0,max):'';
const metric=v=>Number.isFinite(v)&&v>=0?v:null;

export function normalizeProgramHeartbeat(input,now=Date.now()){
  if(!input||typeof input!=='object')throw new Error('heartbeat object required');
  const programId=clean(input.programId,100);if(!programId)throw new Error('programId required');
  const instanceId=clean(input.instanceId||input.deviceId||'browser',120);
  const measured=new Date(input.measuredAt||now);if(!Number.isFinite(measured.getTime()))throw new Error('invalid measuredAt');
  return Object.freeze({
    schema:PROGRAM_HEARTBEAT_SCHEMA,
    programId,
    instanceId,
    deviceId:`program:${programId}:${instanceId}`,
    name:clean(input.name||programId,120),
    deviceType:clean(input.deviceType||'PROGRAM',50)||'PROGRAM',
    version:clean(input.version,80)||null,
    build:clean(input.build,80)||null,
    status:STATUS.has(input.status)?input.status:'UNKNOWN',
    measuredAt:measured.toISOString(),
    latencyMs:metric(input.latencyMs),
    trafficRx:metric(input.trafficRx),
    trafficTx:metric(input.trafficTx),
    queueDepth:metric(input.queueDepth),
    errorCount:metric(input.errorCount),
    source:clean(input.source||'PROGRAM_HEARTBEAT',80),
    trust:clean(input.trust||'SELF_REPORTED',80),
    message:clean(input.message,240)
  });
}

export function heartbeatToDevice(hb){const x=normalizeProgramHeartbeat(hb);return{deviceId:x.deviceId,name:x.name,deviceType:x.deviceType,programId:x.programId,version:x.version,status:x.status,measuredAt:x.measuredAt,latencyMs:x.latencyMs,trafficRx:x.trafficRx,trafficTx:x.trafficTx,source:x.source,trust:x.trust,message:x.message};}
