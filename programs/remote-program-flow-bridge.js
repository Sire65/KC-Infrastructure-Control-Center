const ENDPOINT='https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kicc-program-flow';
let lastError=null;
let lastSuccessAt=null;
let lastCount=0;

async function auth(){
  try{return await globalThis.KICC_AUTH?.getProgramHeartbeatBridgeAuth?.()||null;}catch{return null;}
}
function mapRow(row){
  return {
    schema:'kicc.program-flow.v1',
    eventId:`remote:${row.program_id}:${row.instance_id}:${row.received_at}:${row.source_id}:${row.target_id}`,
    programId:row.program_id,
    instanceId:row.instance_id,
    from:row.source_id,
    to:row.target_id,
    type:row.flow_type,
    status:row.status,
    count:Number.isFinite(Number(row.event_count))?Number(row.event_count):null,
    bytes:Number.isFinite(Number(row.byte_count))?Number(row.byte_count):null,
    measuredAt:row.measured_at,
    source:row.source||'PROGRAM_FLOW',
    trust:row.trust||'SERVER_VERIFIED',
    message:'serverseitig verifiziert'
  };
}
async function refresh(){
  const a=await auth();
  if(!a?.authorization){lastError='AUTH_REQUIRED';return {ok:false,reason:lastError};}
  const headers={accept:'application/json',authorization:a.authorization};
  if(a.apikey)headers.apikey=a.apikey;
  try{
    const r=await fetch(ENDPOINT,{headers,cache:'no-store',credentials:'omit'});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const body=await r.json();
    const rows=Array.isArray(body?.events)?body.events:[];
    let accepted=0;
    for(const row of rows){if(globalThis.KICC_PROGRAM_FLOWS?.ingest?.(mapRow(row)))accepted++;}
    lastCount=rows.length;lastSuccessAt=new Date().toISOString();lastError=null;
    globalThis.dispatchEvent(new CustomEvent('kicc:remote-program-flows-refreshed',{detail:{count:rows.length,accepted}}));
    return {ok:true,count:rows.length,accepted};
  }catch(e){lastError=e instanceof Error?e.message:String(e);return {ok:false,reason:lastError};}
}
function status(){return{endpoint:ENDPOINT,lastSuccessAt,lastError,lastCount,state:lastSuccessAt&&!lastError?'READY':lastError==='AUTH_REQUIRED'?'AUTH_REQUIRED':lastError?'DEGRADED':'VERIFYING'};}
setTimeout(refresh,4500);setInterval(refresh,15000);
addEventListener('kicc:tabchange',e=>{if(e.detail?.tab==='live')refresh();});
globalThis.KICC_REMOTE_PROGRAM_FLOWS={refresh,status,endpoint:ENDPOINT};
