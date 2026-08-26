export const DATABASE_CAPABILITIES=['health','latency','reads','writes','storage','schema','policies','integrity','drift','sync','backup','restore','failover','migration'];

export function makeDatabaseResource({id,name,provider,role='UNASSIGNED',scope='remote',adapterId=null,capabilities=[]}){
  return {id,type:'DATASTORE',name,provider,role,scope,adapterId,status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',latencyMs:null,storage:null,schema:null,policies:null,sync:null,backup:null,capabilities:[...new Set(capabilities)]};
}

export function capabilityState(resource,capability){
  if(!resource.capabilities?.includes(capability)) return 'UNSUPPORTED';
  const value=resource[capability];
  if(value===null||value===undefined) return 'UNKNOWN';
  return 'AVAILABLE';
}

export function summarizeDatabase(resource){
  return {
    id:resource.id,
    provider:resource.provider,
    role:resource.role,
    status:resource.status||'UNKNOWN',
    measuredAt:resource.measuredAt||null,
    trust:resource.trust||'UNVERIFIED',
    latencyMs:Number.isFinite(resource.latencyMs)?resource.latencyMs:null,
    capabilities:DATABASE_CAPABILITIES.map(capability=>({capability,state:capabilityState(resource,capability)}))
  };
}
