import { PROGRAM_HEARTBEAT_SCHEMA,normalizeProgramHeartbeat } from './program-heartbeat-contract.js';
const CHANNEL='kicc-program-heartbeat-v1';
let channel=null;try{if('BroadcastChannel'in globalThis)channel=new BroadcastChannel(CHANNEL);}catch{}
export function emitProgramHeartbeat(input){const heartbeat=normalizeProgramHeartbeat({...input,schema:PROGRAM_HEARTBEAT_SCHEMA});try{channel?.postMessage(heartbeat);}catch{}try{globalThis.dispatchEvent(new CustomEvent('kicc:program-heartbeat',{detail:heartbeat}));}catch{}try{if(globalThis.parent&&globalThis.parent!==globalThis)globalThis.parent.postMessage({type:'KICC_PROGRAM_HEARTBEAT',heartbeat},location.origin);}catch{}return heartbeat;}
export function startProgramHeartbeat(config,{intervalMs=30_000}={}){let stopped=false;const send=()=>{if(stopped)return;emitProgramHeartbeat(typeof config==='function'?config():config);};send();const timer=setInterval(send,Math.max(10_000,intervalMs));return()=>{stopped=true;clearInterval(timer);};}
export const ProgramHeartbeatClient={schema:PROGRAM_HEARTBEAT_SCHEMA,emitProgramHeartbeat,startProgramHeartbeat};
