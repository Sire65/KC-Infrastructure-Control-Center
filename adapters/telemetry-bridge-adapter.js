function assertBridgePayload(payload,targetId){
  if(!payload||typeof payload!=='object') throw new Error('Invalid telemetry payload');
  if(payload.targetId!==targetId) throw new Error('Telemetry target mismatch');
  if(!payload.status) throw new Error('Telemetry status missing');
  if(!payload.measuredAt) throw new Error('Telemetry timestamp missing');
  return payload;
}

function sanitizeCapabilityBlock(value){
  if(value===null||value===undefined) return null;
  if(typeof value==='string'||typeof value==='number'||typeof value==='boolean') return value;
  if(Array.isArray(value)) return value.slice(0,100);
  if(typeof value==='object'){
    const allowed=['state','count','bytes','ageSeconds','lastSuccess','lagMs','version','hash','enabled','healthy','detail'];
    return Object.fromEntries(Object.entries(value).filter(([key])=>allowed.includes(key)));
  }
  return null;
}
function sanitizeProgramRuntime(value){
  if(!value||typeof value!=='object')return null;
  const clean=(v,n=120)=>typeof v==='string'?v.trim().slice(0,n):'';
  const measuredAt=clean(value.measuredAt,60);if(!clean(value.programId,100)||!measuredAt||!Number.isFinite(new Date(measuredAt).getTime()))return null;
  return {
    schema:'kicc.program-heartbeat.v1',programId:clean(value.programId,100),instanceId:clean(value.instanceId,120)||'server-observed',
    name:clean(value.name,120)||clean(value.programId,100),deviceType:clean(value.deviceType,60)||'WEB_APP',version:clean(value.version,80)||'unknown',build:clean(value.build,80)||clean(value.version,80)||'unknown',
    status:['ONLINE','OFFLINE','DEGRADED','MAINTENANCE'].includes(String(value.status||'').toUpperCase())?String(value.status).toUpperCase():'UNKNOWN',
    measuredAt,latencyMs:null,trafficRx:null,trafficTx:null,queueDepth:null,errorCount:0,source:clean(value.source,80)||'TELEMETRY_BRIDGE',trust:clean(value.trust,80)||'OBSERVED_SERVER',message:clean(value.deviceName,120)
  };
}

export function createTelemetryBridgeAdapter({id='telemetry-bridge',endpointResolver,authResolver=null}){
  if(typeof endpointResolver!=='function') throw new TypeError('endpointResolver required');
  return {
    id,
    kind:'telemetry-bridge',
    capabilities:['health','latency','reads','writes','storage','schema','policies','integrity','drift','sync','backup','restore','failover','migration'],
    async probe(target){
      const endpoint=endpointResolver(target);
      if(!endpoint) return {status:'UNKNOWN',trust:'UNVERIFIED',message:'Keine Telemetrie-Bridge konfiguriert.'};
      const headers={'accept':'application/json'};
      if(typeof authResolver==='function'){
        const auth=await authResolver(target);
        if(!auth?.authorization) return {status:'UNKNOWN',trust:'AUTH_REQUIRED',message:'Bridge bereit; Anmeldung für Live-Telemetrie erforderlich.'};
        headers.authorization=auth.authorization;
        if(auth.apikey) headers.apikey=auth.apikey;
      }
      const response=await fetch(endpoint,{method:'GET',headers,cache:'no-store',credentials:'omit'});
      if(response.status===401||response.status===403) return {status:'UNKNOWN',trust:'AUTH_REQUIRED',message:'Bridge aktiv; Anmeldung fehlt oder ist abgelaufen.'};
      if(!response.ok) throw new Error(`Bridge HTTP ${response.status}`);
      const payload=assertBridgePayload(await response.json(),target.id);
      const observedAt=new Date(payload.measuredAt).getTime();
      if(!Number.isFinite(observedAt)) throw new Error('Invalid telemetry timestamp');
      if(Date.now()-observedAt>120000) return {status:'UNKNOWN',trust:'STALE',message:'Bridge-Telemetrie ist veraltet.'};
      const observation={status:payload.status,measuredAt:payload.measuredAt,trust:'OBSERVED_REMOTE',message:payload.message||'Sichere Telemetrie-Bridge aktiv.'};
      for(const key of this.capabilities){if(key in payload) observation[key]=sanitizeCapabilityBlock(payload[key]);}
      const runtime=sanitizeProgramRuntime(payload.programRuntime);if(runtime)observation.programRuntime=runtime;
      return observation;
    }
  };
}
