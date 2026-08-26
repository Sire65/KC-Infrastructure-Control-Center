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

export function createTelemetryBridgeAdapter({id='telemetry-bridge',endpointResolver}){
  if(typeof endpointResolver!=='function') throw new TypeError('endpointResolver required');
  return {
    id,
    kind:'telemetry-bridge',
    capabilities:['health','latency','reads','writes','storage','schema','policies','integrity','drift','sync','backup','restore','failover','migration'],
    async probe(target){
      const endpoint=endpointResolver(target);
      if(!endpoint) return {status:'UNKNOWN',trust:'UNVERIFIED',message:'Keine Telemetrie-Bridge konfiguriert.'};
      const response=await fetch(endpoint,{method:'GET',headers:{'accept':'application/json'},cache:'no-store',credentials:'omit'});
      if(!response.ok) throw new Error(`Bridge HTTP ${response.status}`);
      const payload=assertBridgePayload(await response.json(),target.id);
      const observedAt=new Date(payload.measuredAt).getTime();
      if(!Number.isFinite(observedAt)) throw new Error('Invalid telemetry timestamp');
      if(Date.now()-observedAt>120000) return {status:'UNKNOWN',trust:'STALE',message:'Bridge-Telemetrie ist veraltet.'};
      const observation={status:payload.status,measuredAt:payload.measuredAt,trust:'OBSERVED_REMOTE',message:payload.message||'Sichere Telemetrie-Bridge aktiv.'};
      for(const key of this.capabilities){if(key in payload) observation[key]=sanitizeCapabilityBlock(payload[key]);}
      return observation;
    }
  };
}
