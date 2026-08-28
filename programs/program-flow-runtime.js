import {normalizeProgramFlow,PROGRAM_FLOW_SCHEMA,PROGRAM_FLOW_MAX_AGE_MS,PROGRAM_FLOW_FUTURE_TOLERANCE_MS} from './program-flow-contract.js';
const CHANNEL='kicc-program-flow-v1';
const events=[];
const ids=new Set();
const MAX_EVENTS=240;
function validTime(x,now=Date.now(),maxAgeMs=PROGRAM_FLOW_MAX_AGE_MS){const t=Date.parse(x?.measuredAt||'');return Number.isFinite(t)&&t<=now+PROGRAM_FLOW_FUTURE_TOLERANCE_MS&&now-t<=maxAgeMs;}
function purge(now=Date.now()){
 const keep=[];ids.clear();
 for(const x of events){if(validTime(x,now)){keep.push(x);if(x?.eventId)ids.add(x.eventId);}}
 keep.sort((a,b)=>Date.parse(a.measuredAt)-Date.parse(b.measuredAt));
 if(keep.length>MAX_EVENTS)keep.splice(0,keep.length-MAX_EVENTS);
 events.splice(0,events.length,...keep);ids.clear();for(const x of events)if(x?.eventId)ids.add(x.eventId);
}
function ingest(raw){
 try{
  if(raw?.schema&&raw.schema!==PROGRAM_FLOW_SCHEMA)return false;
  const flow=normalizeProgramFlow(raw);
  purge();
  if(!validTime(flow)||flow.eventId&&ids.has(flow.eventId))return false;
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
globalThis.KICC_PROGRAM_FLOWS={schema:PROGRAM_FLOW_SCHEMA,channel:CHANNEL,maxAgeMs:PROGRAM_FLOW_MAX_AGE_MS,ingest,list(){purge();return [...events];},recent(ms=45000){purge();const max=Math.min(Math.max(0,Number(ms)||0),PROGRAM_FLOW_MAX_AGE_MS);return events.filter(x=>validTime(x,Date.now(),max));},fresh:validTime};
