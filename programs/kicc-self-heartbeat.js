import { startProgramHeartbeat } from './program-heartbeat-client.js';

function instanceId(){
  try{
    const key='kicc.instance.id.v1';let id=localStorage.getItem(key);
    if(!id){id=`browser-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`;localStorage.setItem(key,id);}
    return id;
  }catch{return 'browser';}
}
function networkLatency(){const nav=performance.getEntriesByType?.('navigation')?.[0];return Number.isFinite(nav?.responseStart)&&Number.isFinite(nav?.requestStart)?Math.max(0,Math.round(nav.responseStart-nav.requestStart)):null;}
function status(){return document.visibilityState==='hidden'?'ONLINE':'ONLINE';}

const stop=startProgramHeartbeat(()=>({
  programId:'kicc',
  instanceId:instanceId(),
  name:'KICC',
  deviceType:'CONTROL_CENTER',
  version:globalThis.KICC?.version||document.getElementById('version')?.textContent||null,
  build:globalThis.KICC?.version||null,
  status:status(),
  measuredAt:new Date().toISOString(),
  latencyMs:networkLatency(),
  errorCount:0,
  source:'KICC_SELF_HEARTBEAT',
  trust:'OBSERVED_LOCAL_RUNTIME',
  message:'KICC Browser Runtime aktiv'
}),{intervalMs:30_000});

globalThis.KICC_SELF_HEARTBEAT={stop};
