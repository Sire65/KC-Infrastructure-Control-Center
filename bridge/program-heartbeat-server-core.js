import { normalizeProgramHeartbeat } from '../programs/program-heartbeat-contract.js';
import { validateHeartbeatStore } from './program-heartbeat-store-contract.js';

export const SERVER_HEARTBEAT_SCHEMA='kicc.remote-program-heartbeat.v1';
export const SERVER_MAX_BODY_BYTES=16*1024;
export const SERVER_MAX_SKEW_MS=120_000;
export const SERVER_RATE_WINDOW_MS=60_000;
export const SERVER_RATE_LIMIT=30;

const clean=(v,max=180)=>typeof v==='string'?v.trim().slice(0,max):'';
const nonces=new Map();
const rates=new Map();
function purge(now=Date.now()){
  for(const [nonce,ts] of nonces)if(now-ts>5*60_000)nonces.delete(nonce);
  for(const [key,bucket] of rates)if(now-bucket.startedAt>SERVER_RATE_WINDOW_MS)rates.delete(key);
}
function rateCheck(key,now=Date.now()){
  purge(now);const id=clean(key,160)||'unknown';let b=rates.get(id);if(!b){b={startedAt:now,count:0};rates.set(id,b);}b.count++;if(b.count>SERVER_RATE_LIMIT)throw new Error('rate limit exceeded');
}
function bodySize(input){try{return new TextEncoder().encode(JSON.stringify(input)).length;}catch{return Infinity;}}

export function validateServerHeartbeatEnvelope(input,{now=Date.now(),allowedPrograms=[],authenticatedPrincipal=null,sourceIp=null}={}){
  if(!authenticatedPrincipal)throw new Error('authenticated principal required');
  if(!input||typeof input!=='object')throw new Error('heartbeat envelope required');
  if(bodySize(input)>SERVER_MAX_BODY_BYTES)throw new Error('heartbeat envelope too large');
  const nonce=clean(input.nonce,120);if(!nonce)throw new Error('nonce required');
  purge(now);if(nonces.has(nonce))throw new Error('replay detected');
  const sentAt=new Date(input.sentAt||input.heartbeat?.measuredAt);if(!Number.isFinite(sentAt.getTime()))throw new Error('invalid sentAt');
  if(Math.abs(now-sentAt.getTime())>SERVER_MAX_SKEW_MS)throw new Error('stale heartbeat envelope');
  const heartbeat=normalizeProgramHeartbeat(input.heartbeat,now);
  if(Array.isArray(allowedPrograms)&&allowedPrograms.length&&!allowedPrograms.includes(heartbeat.programId))throw new Error('program not allowlisted');
  rateCheck(`${authenticatedPrincipal}:${heartbeat.programId}:${sourceIp||''}`,now);
  nonces.set(nonce,now);
  return Object.freeze({schema:SERVER_HEARTBEAT_SCHEMA,nonce,sentAt:sentAt.toISOString(),principal:clean(authenticatedPrincipal,160),sourceId:clean(input.sourceId,120)||heartbeat.instanceId,heartbeat:{...heartbeat,source:'REMOTE_HEARTBEAT_SERVER',trust:'OBSERVED_BRIDGE'}});
}

export function createProgramHeartbeatServer({store,allowedPrograms=[],authenticate}={}){
  if(!validateHeartbeatStore(store))throw new Error('valid heartbeat store required');
  if(typeof authenticate!=='function')throw new Error('authenticate function required');
  return Object.freeze({
    async ingest({headers={},body,sourceIp=null}={}){
      const principal=await authenticate(headers);if(!principal)throw new Error('unauthorized');
      const envelope=validateServerHeartbeatEnvelope(body,{allowedPrograms,authenticatedPrincipal:principal,sourceIp});
      const stored=await store.put({envelope,heartbeat:envelope.heartbeat,principal:envelope.principal,receivedAt:new Date().toISOString()});
      return{ok:true,schema:SERVER_HEARTBEAT_SCHEMA,programId:envelope.heartbeat.programId,instanceId:envelope.heartbeat.instanceId,receivedAt:stored.receivedAt};
    },
    async latest({headers={}}={}){
      const principal=await authenticate(headers);if(!principal)throw new Error('unauthorized');
      const rows=await store.latest();
      return{schema:SERVER_HEARTBEAT_SCHEMA,heartbeats:rows.map(x=>({nonce:x.envelope.nonce,sentAt:x.envelope.sentAt,authState:'AUTHENTICATED',sourceId:x.envelope.sourceId,heartbeat:x.heartbeat}))};
    },
    readiness(){return{auth:true,store:true,allowlist:Array.isArray(allowedPrograms)&&allowedPrograms.length>0,rateLimit:true,replayProtection:true,maxBodyBytes:SERVER_MAX_BODY_BYTES};}
  });
}
