const ENDPOINT='https://kc-failover-gateway.ha-joko.workers.dev';
const PROGRAM_ID='kc-failover-gateway';
const INSTANCE_ID='cloudflare-worker';
const POLL_MS=30000;
let timer=null,last=null;

function num(v){return Number.isFinite(Number(v))?Number(v):null;}
function heartbeat(data,latencyMs,measuredAt){
  const online=data?.status==='OK';
  const degraded=data?.status==='DEGRADED'||data?.activeBackend==='LOCAL_QUEUE';
  globalThis.KICC_PROGRAM_HEARTBEATS?.ingest?.({
    programId:PROGRAM_ID,
    instanceId:INSTANCE_ID,
    name:'KC Failover Gateway',
    deviceType:'FAILOVER_GATEWAY',
    version:null,
    build:null,
    status:online?'ONLINE':degraded?'DEGRADED':'UNKNOWN',
    measuredAt,
    latencyMs,
    queueDepth:null,
    source:'GATEWAY_HEALTH',
    trust:'OBSERVED_REMOTE',
    message:`Backend ${data?.activeBackend||'UNKNOWN'} · Supabase ${data?.primary?.reachable?'OK':'nicht erreichbar'} · Neon ${data?.fallback?.reachable?'OK':'nicht erreichbar'}`
  });
}
function flowFor(data){
  const backend=String(data?.activeBackend||'').toUpperCase();
  if(backend==='SUPABASE')return {to:'supabase-core',latencyMs:num(data?.primary?.latencyMs),status:data?.primary?.reachable?'OK':'DEGRADED',type:'API'};
  if(backend==='NEON')return {to:'neon-core-mirror',latencyMs:num(data?.fallback?.latencyMs),status:data?.fallback?.reachable?'OK':'DEGRADED',type:'API'};
  if(backend==='LOCAL_QUEUE')return {to:'service:Lokale Warteschlange',latencyMs:null,status:'DEGRADED',type:'OTHER'};
  return null;
}
function ingestFlow(data,measuredAt){
  const f=flowFor(data);if(!f)return;
  globalThis.KICC_PROGRAM_FLOWS?.ingest?.({
    programId:PROGRAM_ID,
    instanceId:INSTANCE_ID,
    from:`program:${PROGRAM_ID}`,
    to:f.to,
    type:f.type,
    status:f.status,
    latencyMs:f.latencyMs,
    measuredAt,
    source:'GATEWAY_HEALTH',
    trust:'OBSERVED_REMOTE',
    message:data.activeBackend==='LOCAL_QUEUE'?'Beide Datenbankpfade nicht verfügbar · lokale Warteschlange erforderlich':`Aktives Gateway-Backend: ${data.activeBackend}`
  });
}
async function probe(){
  const started=performance.now();
  try{
    const r=await fetch(ENDPOINT,{cache:'no-store',headers:{Accept:'application/json'}});
    const latencyMs=Math.round(performance.now()-started);
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const data=await r.json(),measuredAt=data?.timestamp||new Date().toISOString();
    last={ok:true,measuredAt,latencyMs,data};
    heartbeat(data,latencyMs,measuredAt);ingestFlow(data,measuredAt);
    globalThis.dispatchEvent(new CustomEvent('kicc:failover-gateway-observed',{detail:last}));
    return last;
  }catch(error){
    const measuredAt=new Date().toISOString(),latencyMs=Math.round(performance.now()-started);
    last={ok:false,measuredAt,latencyMs,error:String(error?.message||error)};
    globalThis.KICC_PROGRAM_HEARTBEATS?.ingest?.({programId:PROGRAM_ID,instanceId:INSTANCE_ID,name:'KC Failover Gateway',deviceType:'FAILOVER_GATEWAY',status:'OFFLINE',measuredAt,latencyMs,source:'GATEWAY_HEALTH',trust:'OBSERVED_ATTEMPT',message:last.error});
    globalThis.dispatchEvent(new CustomEvent('kicc:failover-gateway-observed',{detail:last}));
    return last;
  }
}
function start(){if(timer)return;probe();timer=setInterval(probe,POLL_MS);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
globalThis.KICC_FAILOVER_GATEWAY={endpoint:ENDPOINT,probe,start,last:()=>last};
