import { heartbeatToDevice,PROGRAM_HEARTBEAT_SCHEMA } from './program-heartbeat-contract.js';
const CHANNEL='kicc-program-heartbeat-v1';
function ingest(raw){try{if(raw?.schema&&raw.schema!==PROGRAM_HEARTBEAT_SCHEMA)return false;const device=heartbeatToDevice(raw);globalThis.KICC_DEVICES?.ingest?.(device);globalThis.dispatchEvent(new CustomEvent('kicc:program-heartbeat-ingested',{detail:device}));return true;}catch{return false;}}
function bind(){
  globalThis.addEventListener('kicc:program-heartbeat',e=>ingest(e.detail));
  globalThis.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.type==='KICC_PROGRAM_HEARTBEAT')ingest(e.data.heartbeat);});
  if('BroadcastChannel'in globalThis){const bc=new BroadcastChannel(CHANNEL);bc.addEventListener('message',e=>ingest(e.data));globalThis.KICC_PROGRAM_HEARTBEAT_CHANNEL=bc;}
}
bind();
globalThis.KICC_PROGRAM_HEARTBEATS={schema:PROGRAM_HEARTBEAT_SCHEMA,channel:CHANNEL,ingest};
