const ALLOWED_STATUS=new Set(['HEALTHY','ONLINE','DEGRADED','FAILED','OFFLINE','MAINTENANCE','UNKNOWN']);
const CAPABILITIES=['health','latency','reads','writes','storage','schema','policies','integrity','drift','sync','backup','restore','failover','migration'];

export function makeTelemetryResponse({targetId,status,measuredAt=new Date().toISOString(),message='',capabilities={}}){
  if(!targetId) throw new TypeError('targetId required');
  const safeStatus=ALLOWED_STATUS.has(status)?status:'UNKNOWN';
  const result={targetId,status:safeStatus,measuredAt,message:String(message||'').slice(0,300)};
  for(const name of CAPABILITIES){
    if(!(name in capabilities)) continue;
    result[name]=sanitize(capabilities[name]);
  }
  return result;
}

function sanitize(value){
  if(value===null||value===undefined) return null;
  if(['string','number','boolean'].includes(typeof value)) return value;
  if(Array.isArray(value)) return value.slice(0,100).map(sanitize);
  if(typeof value==='object'){
    const allowed=['state','count','bytes','ageSeconds','lastSuccess','lagMs','version','hash','enabled','healthy','detail'];
    return Object.fromEntries(Object.entries(value).filter(([key])=>allowed.includes(key)).map(([key,val])=>[key,sanitize(val)]));
  }
  return null;
}

export const telemetryResponseCapabilities=[...CAPABILITIES];
