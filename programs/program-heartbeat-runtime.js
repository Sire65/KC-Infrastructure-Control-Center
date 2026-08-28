import { heartbeatToDevice,PROGRAM_HEARTBEAT_SCHEMA,PROGRAM_HEARTBEAT_MAX_AGE_MS } from './program-heartbeat-contract.js';
const CHANNEL='kicc-program-heartbeat-v1';
const latest=new Map();
function keyOf(x){return `${x.programId||'unknown'}:${x.instanceId||x.deviceId||'browser'}`;}
function fresh(hb,now=Date.now()){if(!hb?.measuredAt)return false;const t=new Date(hb.measuredAt).getTime();return Number.isFinite(t)&&t<=now+15_000&&now-t<=PROGRAM_HEARTBEAT_MAX_AGE_MS;}
function ingest(raw){try{if(raw?.schema&&raw.schema!==PROGRAM_HEARTBEAT_SCHEMA)return false;const device=heartbeatToDevice(raw);const measured=new Date(device.measuredAt).getTime();if(!Number.isFinite(measured)||measured>Date.now()+15_000)return false;latest.set(device.deviceId,device);globalThis.KICC_DEVICES?.ingest?.(device);globalThis.dispatchEvent(new CustomEvent('kicc:program-heartbeat-ingested',{detail:device}));return device;}catch{return false;}}
function list(){return [...latest.values()];}
function recent(ms=PROGRAM_HEARTBEAT_MAX_AGE_MS){const min=Date.now()-Math.min(ms,PROGRAM_HEARTBEAT_MAX_AGE_MS);return list().filter(x=>{const t=new Date(x.measuredAt).getTime();return Number.isFinite(t)&&t>=min&&t<=Date.now()+15_000;});}
function forProgram(programId){return recent().filter(x=>x.programId===programId).sort((a,b)=>new Date(b.measuredAt)-new Date(a.measuredAt));}
function evidence(programId){const rows=forProgram(programId),hb=rows[0]||null;return{programId,fresh:!!hb&&fresh(hb),status:hb?.status||'UNKNOWN',measuredAt:hb?.measuredAt||null,ageMs:hb?Math.max(0,Date.now()-new Date(hb.measuredAt).getTime()):null,source:hb?.source||null,trust:hb?.trust||null,instances:rows.length};}
function bind(){
 globalThis.addEventListener('kicc:program-heartbeat',e=>ingest(e.detail));
 globalThis.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.type==='KICC_PROGRAM_HEARTBEAT')ingest(e.data.heartbeat);});
 if('BroadcastChannel'in globalThis){const bc=new BroadcastChannel(CHANNEL);bc.addEventListener('message',e=>ingest(e.data));globalThis.KICC_PROGRAM_HEARTBEAT_CHANNEL=bc;}
}
bind();
globalThis.KICC_PROGRAM_HEARTBEATS={schema:PROGRAM_HEARTBEAT_SCHEMA,channel:CHANNEL,maxAgeMs:PROGRAM_HEARTBEAT_MAX_AGE_MS,ingest,list,recent,forProgram,evidence,fresh};
