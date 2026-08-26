const ALLOWED=new Set(['ONLINE','DEGRADED','OFFLINE','UNKNOWN','MAINTENANCE']);
const DEFAULT_MAX_AGE=90_000;
const heartbeats=new Map();

function text(v,max=180){return typeof v==='string'?v.slice(0,max):'';}
function num(v){return Number.isFinite(v)&&v>=0?v:null;}

export function normalizeHeartbeat(input,now=Date.now()){
  if(!input?.deviceId)throw new Error('deviceId required');
  const measuredAt=input.measuredAt?new Date(input.measuredAt):new Date(now);
  if(!Number.isFinite(measuredAt.getTime()))throw new Error('invalid measuredAt');
  return{
    deviceId:text(input.deviceId,100),
    name:text(input.name||input.deviceId,120),
    deviceType:text(input.deviceType||'UNKNOWN',50),
    programId:text(input.programId||'',100)||null,
    version:text(input.version||'',80)||null,
    status:ALLOWED.has(input.status)?input.status:'UNKNOWN',
    measuredAt:measuredAt.toISOString(),
    latencyMs:num(input.latencyMs),
    trafficRx:num(input.trafficRx),
    trafficTx:num(input.trafficTx),
    source:text(input.source||'UNVERIFIED',80),
    trust:text(input.trust||'UNVERIFIED',80),
    message:text(input.message||'',240)
  };
}

export function ingestHeartbeat(input){const hb=normalizeHeartbeat(input);heartbeats.set(hb.deviceId,hb);return hb;}
export function effectiveStatus(hb,{now=Date.now(),maxAgeMs=DEFAULT_MAX_AGE}={}){if(!hb)return'UNKNOWN';const age=now-new Date(hb.measuredAt).getTime();if(age>maxAgeMs)return'OFFLINE';return hb.status;}
export function listHeartbeats(){return [...heartbeats.values()].sort((a,b)=>a.name.localeCompare(b.name,'de'));}
export function clearHeartbeats(){heartbeats.clear();}

export const DeviceHeartbeat={ingestHeartbeat,effectiveStatus,listHeartbeats,clearHeartbeats};
