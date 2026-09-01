export const HEARTBEAT_SERVER_STATES=Object.freeze({PREPARED:'PREPARED',AUTH_REQUIRED:'AUTH_REQUIRED',STORE_REQUIRED:'STORE_REQUIRED',ALLOWLIST_REQUIRED:'ALLOWLIST_REQUIRED',VERIFYING:'VERIFYING',READY:'READY',DEGRADED:'DEGRADED'});

export function evaluateHeartbeatServerReadiness({endpoint=null,https=false,authConfigured=false,storeConfigured=false,allowlistCount=0,replayProtection=false,rateLimit=false,lastProbeOk=null,lastError=null}={}){
  if(!endpoint)return{state:HEARTBEAT_SERVER_STATES.PREPARED,reason:'Server-Core vorbereitet; noch kein produktiver Endpoint aktiviert'};
  if(!https)return{state:HEARTBEAT_SERVER_STATES.DEGRADED,reason:'Endpoint ist nicht HTTPS'};
  if(!authConfigured)return{state:HEARTBEAT_SERVER_STATES.AUTH_REQUIRED,reason:'Endpoint vorhanden, Authentifizierung fehlt'};
  if(!storeConfigured)return{state:HEARTBEAT_SERVER_STATES.STORE_REQUIRED,reason:'Authentifizierung vorhanden, Heartbeat-Store fehlt'};
  if(!allowlistCount)return{state:HEARTBEAT_SERVER_STATES.ALLOWLIST_REQUIRED,reason:'Program-Allowlist ist leer'};
  if(!replayProtection||!rateLimit)return{state:HEARTBEAT_SERVER_STATES.DEGRADED,reason:'Replay- oder Rate-Limit-Schutz fehlt'};
  if(lastError)return{state:HEARTBEAT_SERVER_STATES.DEGRADED,reason:lastError};
  if(lastProbeOk===false)return{state:HEARTBEAT_SERVER_STATES.DEGRADED,reason:'Authentifizierte Endpoint-Probe fehlgeschlagen'};
  if(lastProbeOk!==true)return{state:HEARTBEAT_SERVER_STATES.VERIFYING,reason:'Produktiver Server aktiv; authentifizierte KICC-Probe steht noch aus'};
  return{state:HEARTBEAT_SERVER_STATES.READY,reason:'Server-Heartbeat-Eingang authentifiziert verifiziert'};
}

const cfg=globalThis.KICC_PROGRAM_HEARTBEAT_SERVER=globalThis.KICC_PROGRAM_HEARTBEAT_SERVER||{};
Object.assign(cfg,{
  endpoint:cfg.endpoint||'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kicc-program-heartbeat',
  authConfigured:true,
  storeConfigured:true,
  allowedPrograms:['kc-dp2','kc-communication','kicc','kc-pc-manager','kc-bilderkasse','kc-system-check'],
  replayProtection:true,
  rateLimit:true,
  lastProbeOk:cfg.lastProbeOk??null,
  lastError:cfg.lastError||null
});
globalThis.KICC_PROGRAM_HEARTBEAT_ENDPOINT=globalThis.KICC_PROGRAM_HEARTBEAT_ENDPOINT||cfg.endpoint;
globalThis.KICC_HEARTBEAT_SERVER_READINESS={evaluate:evaluateHeartbeatServerReadiness,states:HEARTBEAT_SERVER_STATES};
