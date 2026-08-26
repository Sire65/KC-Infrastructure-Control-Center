export const HEARTBEAT_SERVER_STATES=Object.freeze({PREPARED:'PREPARED',AUTH_REQUIRED:'AUTH_REQUIRED',STORE_REQUIRED:'STORE_REQUIRED',ALLOWLIST_REQUIRED:'ALLOWLIST_REQUIRED',READY:'READY',DEGRADED:'DEGRADED'});

export function evaluateHeartbeatServerReadiness({endpoint=null,https=false,authConfigured=false,storeConfigured=false,allowlistCount=0,replayProtection=false,rateLimit=false,lastProbeOk=null,lastError=null}={}){
  if(!endpoint)return{state:HEARTBEAT_SERVER_STATES.PREPARED,reason:'Server-Core vorbereitet; noch kein produktiver Endpoint aktiviert'};
  if(!https)return{state:HEARTBEAT_SERVER_STATES.DEGRADED,reason:'Endpoint ist nicht HTTPS'};
  if(!authConfigured)return{state:HEARTBEAT_SERVER_STATES.AUTH_REQUIRED,reason:'Endpoint vorhanden, Authentifizierung fehlt'};
  if(!storeConfigured)return{state:HEARTBEAT_SERVER_STATES.STORE_REQUIRED,reason:'Authentifizierung vorhanden, Heartbeat-Store fehlt'};
  if(!allowlistCount)return{state:HEARTBEAT_SERVER_STATES.ALLOWLIST_REQUIRED,reason:'Program-Allowlist ist leer'};
  if(!replayProtection||!rateLimit)return{state:HEARTBEAT_SERVER_STATES.DEGRADED,reason:'Replay- oder Rate-Limit-Schutz fehlt'};
  if(lastError)return{state:HEARTBEAT_SERVER_STATES.DEGRADED,reason:lastError};
  if(lastProbeOk===false)return{state:HEARTBEAT_SERVER_STATES.DEGRADED,reason:'Endpoint-Probe fehlgeschlagen'};
  return{state:HEARTBEAT_SERVER_STATES.READY,reason:lastProbeOk===true?'Server-Heartbeat-Eingang verifiziert bereit':'Konfiguration vollständig; produktive Probe steht noch aus'};
}

globalThis.KICC_HEARTBEAT_SERVER_READINESS={evaluate:evaluateHeartbeatServerReadiness,states:HEARTBEAT_SERVER_STATES};
