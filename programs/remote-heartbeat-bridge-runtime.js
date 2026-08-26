import { bridgeReadiness, validateRemoteEnvelope } from './remote-heartbeat-bridge-contract.js';

const state={endpoint:null,authenticated:false,lastSuccessAt:null,lastError:null,lastEnvelope:null};
function endpoint(){return globalThis.KICC_PROGRAM_HEARTBEAT_ENDPOINT||state.endpoint||null;}
function auth(){return typeof globalThis.KICC_AUTH?.getProgramHeartbeatBridgeAuth==='function'?globalThis.KICC_AUTH.getProgramHeartbeatBridgeAuth():null;}
function snapshot(){return bridgeReadiness({endpoint:endpoint(),authenticated:state.authenticated,lastSuccessAt:state.lastSuccessAt,lastError:state.lastError});}
function publish(){globalThis.dispatchEvent(new CustomEvent('kicc:remote-heartbeat-bridge',{detail:{...snapshot(),endpoint:endpoint(),lastSuccessAt:state.lastSuccessAt,lastError:state.lastError}}));}
function markServerProbe(ok,error=null){const cfg=globalThis.KICC_PROGRAM_HEARTBEAT_SERVER;if(!cfg)return;cfg.lastProbeOk=ok;cfg.lastError=error?String(error):null;cfg.lastProbeAt=new Date().toISOString();}
function normalizeVerifiedRow(row){
  if(!row||typeof row!=='object'||row.trust!=='OBSERVED_BRIDGE')return null;
  const programId=String(row.program_id||'').trim(),instanceId=String(row.instance_id||'').trim();if(!programId||!instanceId)return null;
  return{schema:'kicc.program-heartbeat.v1',programId,instanceId,name:programId,deviceType:'PROGRAM',version:row.version||null,build:row.build||null,status:String(row.status||'UNKNOWN').toUpperCase(),measuredAt:row.measured_at||row.received_at||new Date().toISOString(),latencyMs:Number.isFinite(row.latency_ms)?row.latency_ms:null,trafficRx:Number.isFinite(row.traffic_rx)?row.traffic_rx:null,trafficTx:Number.isFinite(row.traffic_tx)?row.traffic_tx:null,queueDepth:Number.isFinite(row.queue_depth)?row.queue_depth:null,errorCount:Number.isFinite(row.error_count)?row.error_count:null,source:'REMOTE_HEARTBEAT_SERVER',trust:'OBSERVED_BRIDGE',message:'Serverseitig authentifiziert und geprüft'};
}

export async function refreshRemoteHeartbeatBridge(){
  const url=endpoint();
  if(!url){state.authenticated=false;state.lastError=null;publish();return snapshot();}
  let credentials=null;try{credentials=await auth();}catch{}
  state.authenticated=Boolean(credentials?.authorization||credentials?.apikey);
  if(!state.authenticated){state.lastError=null;publish();return snapshot();}
  const headers={accept:'application/json'};if(credentials.authorization)headers.authorization=credentials.authorization;if(credentials.apikey)headers.apikey=credentials.apikey;
  try{
    const response=await fetch(url,{headers,cache:'no-store',credentials:'omit'});
    if(!response.ok)throw new Error(`Remote heartbeat HTTP ${response.status}`);
    const payload=await response.json();const rows=Array.isArray(payload)?payload:(Array.isArray(payload?.heartbeats)?payload.heartbeats:[]);
    for(const raw of rows){
      const verified=normalizeVerifiedRow(raw);
      if(verified){globalThis.KICC_PROGRAM_HEARTBEATS?.ingest?.(verified);state.lastEnvelope={heartbeat:verified,trust:'OBSERVED_BRIDGE'};continue;}
      const env=validateRemoteEnvelope(raw);globalThis.KICC_PROGRAM_HEARTBEATS?.ingest?.(env.heartbeat);state.lastEnvelope=env;
    }
    state.lastSuccessAt=new Date().toISOString();state.lastError=null;markServerProbe(true,null);
  }catch(error){state.lastError=error instanceof Error?error.message:String(error);markServerProbe(false,state.lastError);}
  publish();return snapshot();
}

export function configureRemoteHeartbeatBridge({endpoint:nextEndpoint=null}={}){state.endpoint=nextEndpoint;publish();return snapshot();}
export function remoteHeartbeatBridgeStatus(){return {...snapshot(),endpoint:endpoint(),lastSuccessAt:state.lastSuccessAt,lastError:state.lastError};}

globalThis.KICC_REMOTE_HEARTBEAT_BRIDGE={refresh:refreshRemoteHeartbeatBridge,status:remoteHeartbeatBridgeStatus,configure:configureRemoteHeartbeatBridge};
refreshRemoteHeartbeatBridge();setInterval(refreshRemoteHeartbeatBridge,30_000);
