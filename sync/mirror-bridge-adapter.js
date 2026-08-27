const ALLOWED_STATUS=new Set(['HEALTHY','DEGRADED','FAILED','UNKNOWN','RESYNC_REQUIRED']);
const MAX_FUTURE_SKEW_MS=30000;

function safeNumber(value){return Number.isFinite(value)&&value>=0?value:null;}
function safeText(value,max=300){return typeof value==='string'?value.slice(0,max):'';}

function validateEndpoint(value){
  if(!value)return null;
  const url=new URL(value,globalThis.location?.href||'https://localhost/');
  const localhost=['localhost','127.0.0.1','::1'].includes(url.hostname);
  if(url.protocol!=='https:'&&!localhost)throw new Error('Mirror bridge requires HTTPS');
  return url.href;
}

export function sanitizeMirrorPayload(payload,expectedFlowId,now=Date.now()){
  if(!payload||typeof payload!=='object')throw new Error('Invalid mirror telemetry payload');
  if(payload.flowId!==expectedFlowId)throw new Error('Mirror flow mismatch');
  const measuredAt=new Date(payload.measuredAt).getTime();
  if(!Number.isFinite(measuredAt))throw new Error('Invalid mirror timestamp');
  if(measuredAt-now>MAX_FUTURE_SKEW_MS)throw new Error('Mirror timestamp is in the future');
  return {
    status:ALLOWED_STATUS.has(payload.status)?payload.status:'UNKNOWN',
    measuredAt:new Date(measuredAt).toISOString(),
    lastSuccessAt:payload.lastSuccessAt?new Date(payload.lastSuccessAt).toISOString():null,
    runCount24h:safeNumber(payload.runCount24h),
    errorCount24h:safeNumber(payload.errorCount24h),
    mismatchCount24h:safeNumber(payload.mismatchCount24h),
    syncLagSec:safeNumber(payload.syncLagSec),
    queueDepth:safeNumber(payload.queueDepth),
    conflictCount:safeNumber(payload.conflictCount),
    trust:'OBSERVED_REMOTE',
    message:safeText(payload.message)
  };
}

export function createMirrorBridgeAdapter({flowId,endpointResolver,authResolver,maxAgeMs=120000}){
  if(!flowId)throw new TypeError('flowId required');
  if(typeof endpointResolver!=='function')throw new TypeError('endpointResolver required');
  return {
    id:`mirror-bridge:${flowId}`,
    flowId,
    refreshMs:60000,
    maxAgeMs,
    async probe(){
      const endpoint=validateEndpoint(endpointResolver(flowId));
      if(!endpoint)return {status:'UNKNOWN',trust:'UNVERIFIED',message:'Keine Mirror-Bridge konfiguriert.'};
      const headers={accept:'application/json'};
      if(typeof authResolver==='function'){
        const auth=await authResolver(flowId);
        if(!auth?.authorization)return {status:'UNKNOWN',trust:'AUTH_REQUIRED',message:'Mirror-Bridge bereit; Anmeldung für Live-Telemetrie erforderlich.'};
        headers.authorization=auth.authorization;
        if(auth.apikey)headers.apikey=auth.apikey;
      }
      const response=await fetch(endpoint,{method:'GET',headers,cache:'no-store',credentials:'omit'});
      if(response.status===401||response.status===403)return {status:'UNKNOWN',trust:'AUTH_REQUIRED',message:'Mirror-Bridge benötigt eine gültige Anmeldung.'};
      if(!response.ok)throw new Error(`Mirror bridge HTTP ${response.status}`);
      const type=response.headers.get('content-type')||'';
      if(!type.toLowerCase().includes('application/json'))throw new Error('Mirror bridge response is not JSON');
      const observation=sanitizeMirrorPayload(await response.json(),flowId);
      const age=Date.now()-new Date(observation.measuredAt).getTime();
      if(age>maxAgeMs)return {...observation,status:'UNKNOWN',trust:'STALE',message:'Mirror-Telemetrie ist veraltet.'};
      return observation;
    }
  };
}
