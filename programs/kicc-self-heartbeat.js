import { startProgramHeartbeat } from './program-heartbeat-client.js';

function instanceId(){
  try{
    const key='kicc.instance.id.v1';let id=localStorage.getItem(key);
    if(!id){id=`browser-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`;localStorage.setItem(key,id);}
    return id;
  }catch{return 'browser';}
}
const INSTANCE_ID=instanceId();
function networkLatency(){const nav=performance.getEntriesByType?.('navigation')?.[0];return Number.isFinite(nav?.responseStart)&&Number.isFinite(nav?.requestStart)?Math.max(0,Math.round(nav.responseStart-nav.requestStart)):null;}
function runtimeVersion(){return globalThis.KICC_BUILD_VERSION||globalThis.KICC?.version||document.getElementById('version')?.textContent||null;}
function heartbeat(latencyMs=networkLatency()){const version=runtimeVersion();return{
  programId:'kicc',instanceId:INSTANCE_ID,name:'KICC',deviceType:'CONTROL_CENTER',
  version,build:version,status:'ONLINE',measuredAt:new Date().toISOString(),
  latencyMs:Number.isFinite(latencyMs)?Math.round(latencyMs):null,errorCount:0,
  source:'KICC_SELF_HEARTBEAT',trust:'OBSERVED_LOCAL_RUNTIME',message:'KICC Browser Runtime aktiv'
};}

const stop=startProgramHeartbeat(()=>heartbeat(),{intervalMs:30_000});
let lastRemoteSuccessAt=null,lastRemoteError=null;
async function sendRemote(){
  const endpoint=globalThis.KICC_PROGRAM_HEARTBEAT_ENDPOINT;
  if(!endpoint)return;
  let auth=null;try{auth=await globalThis.KICC_AUTH?.getProgramHeartbeatBridgeAuth?.();}catch{}
  if(!auth?.authorization)return;
  const hb=heartbeat();
  const envelope={schema:'kicc.remote-program-heartbeat.v1',nonce:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,sentAt:new Date().toISOString(),authState:'AUTHENTICATED',sourceId:INSTANCE_ID,heartbeat:hb};
  const headers={'content-type':'application/json','accept':'application/json',authorization:auth.authorization};if(auth.apikey)headers.apikey=auth.apikey;
  const started=performance.now();
  try{
    const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(envelope),cache:'no-store',credentials:'omit'});
    if(!response.ok)throw new Error(`Heartbeat HTTP ${response.status}`);
    lastRemoteSuccessAt=new Date().toISOString();lastRemoteError=null;
    globalThis.dispatchEvent(new CustomEvent('kicc:program-heartbeat',{detail:heartbeat(performance.now()-started)}));
  }catch(error){lastRemoteError=error instanceof Error?error.message:String(error);}
  globalThis.KICC_SELF_HEARTBEAT_STATE={lastRemoteSuccessAt,lastRemoteError,instanceId:INSTANCE_ID};
}
setTimeout(sendRemote,4000);setInterval(sendRemote,30_000);
globalThis.KICC_SELF_HEARTBEAT={stop,sendRemote,state:()=>({lastRemoteSuccessAt,lastRemoteError,instanceId:INSTANCE_ID})};
