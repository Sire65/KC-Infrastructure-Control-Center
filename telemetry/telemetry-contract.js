export const TELEMETRY_SCHEMA='kicc.telemetry.v1';

export const TELEMETRY_STATUS=Object.freeze({
  HEALTHY:'HEALTHY',DEGRADED:'DEGRADED',FAILED:'FAILED',OFFLINE:'OFFLINE',MAINTENANCE:'MAINTENANCE',UNKNOWN:'UNKNOWN'
});

export const TELEMETRY_TRUST=Object.freeze({
  OBSERVED:'OBSERVED',OBSERVED_REMOTE:'OBSERVED_REMOTE',AUTH_REQUIRED:'AUTH_REQUIRED',STALE:'STALE',UNVERIFIED:'UNVERIFIED'
});

const ALLOWED_STATUS=new Set(Object.values(TELEMETRY_STATUS));
const ALLOWED_TRUST=new Set(Object.values(TELEMETRY_TRUST));

export function makeTelemetryObservation({targetId,status='UNKNOWN',trust='UNVERIFIED',measuredAt=new Date().toISOString(),latencyMs=null,message='',metrics={},capabilities={},source={}}={}){
  if(!targetId) throw new TypeError('targetId required');
  if(!ALLOWED_STATUS.has(status)) throw new TypeError(`Invalid telemetry status: ${status}`);
  if(!ALLOWED_TRUST.has(trust)) throw new TypeError(`Invalid telemetry trust: ${trust}`);
  const ts=new Date(measuredAt).getTime();
  if(!Number.isFinite(ts)) throw new TypeError('Invalid measuredAt');
  return {
    schema:TELEMETRY_SCHEMA,targetId,status,trust,measuredAt:new Date(ts).toISOString(),
    latencyMs:Number.isFinite(latencyMs)?Math.max(0,Math.round(latencyMs)):null,
    message:String(message||''),metrics:sanitizeMetrics(metrics),capabilities:sanitizeCapabilities(capabilities),
    source:sanitizeSource(source)
  };
}

export function validateTelemetryObservation(value,{maxAgeMs=null,expectedTargetId=null}={}){
  if(!value||typeof value!=='object') return {ok:false,reason:'NOT_OBJECT'};
  if(value.schema!==TELEMETRY_SCHEMA) return {ok:false,reason:'SCHEMA_MISMATCH'};
  if(expectedTargetId&&value.targetId!==expectedTargetId) return {ok:false,reason:'TARGET_MISMATCH'};
  if(!ALLOWED_STATUS.has(value.status)) return {ok:false,reason:'STATUS_INVALID'};
  if(!ALLOWED_TRUST.has(value.trust)) return {ok:false,reason:'TRUST_INVALID'};
  const ts=new Date(value.measuredAt).getTime();if(!Number.isFinite(ts)) return {ok:false,reason:'TIMESTAMP_INVALID'};
  if(Number.isFinite(maxAgeMs)&&maxAgeMs>0&&Date.now()-ts>maxAgeMs) return {ok:false,reason:'STALE'};
  return {ok:true,ageMs:Math.max(0,Date.now()-ts)};
}

function sanitizeMetrics(metrics){
  if(!metrics||typeof metrics!=='object'||Array.isArray(metrics)) return {};
  const out={};for(const [k,v] of Object.entries(metrics).slice(0,100)){
    if(typeof v==='number'&&Number.isFinite(v)) out[k]=v;
    else if(typeof v==='string'||typeof v==='boolean'||v===null) out[k]=v;
  }return out;
}
function sanitizeCapabilities(value){
  if(!value||typeof value!=='object'||Array.isArray(value)) return {};
  const out={};for(const [k,v] of Object.entries(value).slice(0,100)){
    if(v===null||typeof v==='string'||typeof v==='number'||typeof v==='boolean') out[k]=v;
    else if(v&&typeof v==='object'&&!Array.isArray(v)) out[k]=Object.fromEntries(Object.entries(v).slice(0,30).filter(([,x])=>x===null||['string','number','boolean'].includes(typeof x)));
  }return out;
}
function sanitizeSource(source){
  if(!source||typeof source!=='object') return {};
  const allowed=['adapterId','kind','provider','channel','version','build','endpointClass'];
  return Object.fromEntries(Object.entries(source).filter(([k,v])=>allowed.includes(k)&&(v===null||['string','number','boolean'].includes(typeof v))));
}

globalThis.KICC_TELEMETRY_CONTRACT={schema:TELEMETRY_SCHEMA,status:TELEMETRY_STATUS,trust:TELEMETRY_TRUST,makeTelemetryObservation,validateTelemetryObservation};
