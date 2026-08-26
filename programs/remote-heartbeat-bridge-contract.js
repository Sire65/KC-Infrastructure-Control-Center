import { normalizeProgramHeartbeat } from './program-heartbeat-contract.js';

export const REMOTE_HEARTBEAT_STATES=Object.freeze({NOT_CONFIGURED:'NOT_CONFIGURED',AUTH_REQUIRED:'AUTH_REQUIRED',READY:'READY',DEGRADED:'DEGRADED',OFFLINE:'OFFLINE'});
export const REMOTE_HEARTBEAT_MAX_SKEW_MS=120_000;
const seenNonces=new Map();
const clean=(v,max=180)=>typeof v==='string'?v.trim().slice(0,max):'';

function purge(now=Date.now()){for(const [nonce,ts] of seenNonces)if(now-ts>5*60_000)seenNonces.delete(nonce);}
export function isHttpsEndpoint(value){try{return new URL(value).protocol==='https:';}catch{return false;}}
export function validateRemoteEnvelope(input,{now=Date.now(),allowedPrograms=null,requireAuthenticated=true}={}){
  if(!input||typeof input!=='object')throw new Error('remote heartbeat envelope required');
  const nonce=clean(input.nonce,120);if(!nonce)throw new Error('nonce required');
  purge(now);if(seenNonces.has(nonce))throw new Error('replay detected');
  const sentAt=new Date(input.sentAt||input.heartbeat?.measuredAt);if(!Number.isFinite(sentAt.getTime()))throw new Error('invalid sentAt');
  if(Math.abs(now-sentAt.getTime())>REMOTE_HEARTBEAT_MAX_SKEW_MS)throw new Error('stale heartbeat envelope');
  const auth=clean(input.authState,40).toUpperCase();
  if(requireAuthenticated&&auth!=='AUTHENTICATED')throw new Error('authenticated source required');
  const heartbeat=normalizeProgramHeartbeat(input.heartbeat,now);
  if(Array.isArray(allowedPrograms)&&allowedPrograms.length&&!allowedPrograms.includes(heartbeat.programId))throw new Error('program not allowlisted');
  seenNonces.set(nonce,now);
  return Object.freeze({schema:'kicc.remote-program-heartbeat.v1',nonce,sentAt:sentAt.toISOString(),authState:auth,sourceId:clean(input.sourceId,120)||heartbeat.instanceId,heartbeat:{...heartbeat,source:'REMOTE_HEARTBEAT_BRIDGE',trust:auth==='AUTHENTICATED'?'OBSERVED_BRIDGE':'SELF_REPORTED'}});
}

export function bridgeReadiness({endpoint=null,authenticated=false,lastSuccessAt=null,lastError=null,now=Date.now()}={}){
  if(!endpoint)return{state:REMOTE_HEARTBEAT_STATES.NOT_CONFIGURED,reason:'Kein Remote-Heartbeat-Endpunkt konfiguriert'};
  if(!isHttpsEndpoint(endpoint))return{state:REMOTE_HEARTBEAT_STATES.DEGRADED,reason:'Remote-Heartbeat-Endpunkt ist nicht HTTPS'};
  if(!authenticated)return{state:REMOTE_HEARTBEAT_STATES.AUTH_REQUIRED,reason:'Endpunkt vorhanden, aber keine authentifizierte KICC-Session'};
  if(lastError)return{state:REMOTE_HEARTBEAT_STATES.DEGRADED,reason:lastError};
  if(lastSuccessAt&&now-new Date(lastSuccessAt).getTime()>180_000)return{state:REMOTE_HEARTBEAT_STATES.DEGRADED,reason:'Letzte Bridge-Messung ist veraltet'};
  return{state:REMOTE_HEARTBEAT_STATES.READY,reason:lastSuccessAt?'Authentifizierte Remote-Heartbeat-Bridge aktiv':'Authentifizierter Kanal bereit; noch kein Heartbeat empfangen'};
}
