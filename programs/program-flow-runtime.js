import {normalizeProgramFlow,PROGRAM_FLOW_SCHEMA,PROGRAM_FLOW_MAX_AGE_MS} from './program-flow-contract.js';
const CHANNEL='kicc-program-flow-v1';
const events=[];
const ids=new Set();
const MAX_EVENTS=240;
function purge(){
 const min=Date.now()-PROGRAM_FLOW_MAX_AGE_MS;
 while(events.length&&new Date(events[0].measuredAt).getTime()<min){const old=events.shift();if(old?.eventId)ids.delete(old.eventId);}
 if(events.length>MAX_EVENTS){const removed=events.splice(0,events.length-MAX_EVENTS);for(const old of removed)if(old?.eventId)ids.delete(old.eventId);}
}
function ingest(raw){
 try{
  if(raw?.schema&&raw.schema!==PROGRAM_FLOW_SCHEMA)return false;
  const flow=normalizeProgramFlow(raw);
  purge();
  if(flow.eventId&&ids.has(flow.eventId))return false;
  events.push(flow);if(flow.eventId)ids.add(flow.eventId);purge();
  globalThis.dispatchEvent(new CustomEvent('kicc:program-flow-ingested',{detail:flow}));
  return flow;
 }catch{return false;}
}
function bind(){
 globalThis.addEventListener('kicc:program-flow',e=>ingest(e.detail));
 globalThis.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.type==='KICC_PROGRAM_FLOW')ingest(e.data.flow);});
 if('BroadcastChannel'in globalThis){const bc=new BroadcastChannel(CHANNEL);bc.addEventListener('message',e=>ingest(e.data));globalThis.KICC_PROGRAM_FLOW_CHANNEL=bc;}
}
bind();
globalThis.KICC_PROGRAM_FLOWS={schema:PROGRAM_FLOW_SCHEMA,channel:CHANNEL,ingest,list(){purge();return [...events];},recent(ms=45000){purge();const min=Date.now()-ms;return events.filter(x=>new Date(x.measuredAt).getTime()>=min);}};
