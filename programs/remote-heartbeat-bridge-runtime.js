import { bridgeReadiness, validateRemoteEnvelope } from './remote-heartbeat-bridge-contract.js';

const state={endpoint:null,authenticated:false,lastSuccessAt:null,lastError:null,lastEnvelope:null};
function endpoint(){return globalThis.KICC_PROGRAM_HEARTBEAT_ENDPOINT||state.endpoint||null;}
function auth(){return typeof globalThis.KICC_AUTH?.getProgramHeartbeatBridgeAuth==='function'?globalThis.KICC_AUTH.getProgramHeartbeatBridgeAuth():null;}
function snapshot(){return bridgeReadiness({endpoint:endpoint(),authenticated:state.authenticated,lastSuccessAt:state.lastSuccessAt,lastError:state.lastError});}
function publish(){globalThis.dispatchEvent(new CustomEvent('kicc:remote-heartbeat-bridge',{detail:{...snapshot(),endpoint:endpoint(),lastSuccessAt:state.lastSuccessAt,lastError:state.lastError}}));}

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
    const payload=await response.json();const envelopes=Array.isArray(payload)?payload:(Array.isArray(payload?.heartbeats)?payload.heartbeats:[]);
    for(const raw of envelopes){const env=validateRemoteEnvelope(raw);globalThis.KICC_PROGRAM_HEARTBEATS?.ingest?.(env.heartbeat);state.lastEnvelope=env;}
    state.lastSuccessAt=new Date().toISOString();state.lastError=null;
  }catch(error){state.lastError=error instanceof Error?error.message:String(error);}
  publish();return snapshot();
}

export function configureRemoteHeartbeatBridge({endpoint:nextEndpoint=null}={}){state.endpoint=nextEndpoint;publish();return snapshot();}
export function remoteHeartbeatBridgeStatus(){return {...snapshot(),endpoint:endpoint(),lastSuccessAt:state.lastSuccessAt,lastError:state.lastError};}

globalThis.KICC_REMOTE_HEARTBEAT_BRIDGE={refresh:refreshRemoteHeartbeatBridge,status:remoteHeartbeatBridgeStatus,configure:configureRemoteHeartbeatBridge};
refreshRemoteHeartbeatBridge();setInterval(refreshRemoteHeartbeatBridge,30_000);
