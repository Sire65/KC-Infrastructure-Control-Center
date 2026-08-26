import { createMirrorFlow, applyMirrorObservation, evaluateMirrorHealth } from './mirror-health-model.js';
import { createMirrorBridgeAdapter } from './mirror-bridge-adapter.js';

const FLOW_ID='flow-supabase-neon-core';
const flow=createMirrorFlow({id:FLOW_ID,sourceId:'db-supabase-core',targetId:'db-neon-core-mirror',name:'KC Core · Supabase ↔ Neon Mirror',requiredForFailover:true,maxAgeMs:120000});

const bridge=createMirrorBridgeAdapter({
  flowId:FLOW_ID,
  endpointResolver(id){return globalThis.KICC_SYNC_BRIDGE_ENDPOINTS?.[id]||null;},
  async authResolver(id){
    if(typeof globalThis.KICC_AUTH?.getMirrorBridgeAuth==='function')return await globalThis.KICC_AUTH.getMirrorBridgeAuth(id);
    return null;
  },
  maxAgeMs:flow.maxAgeMs
});

function fmtAge(ts){if(!ts)return'—';const s=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000));return s<60?`${s}s`:`${Math.round(s/60)}min`;}
function fmtRate(flow){const r=flow.runCount24h??0,e=flow.errorCount24h??0;if(!r)return'—';return `${((e/r)*100).toFixed(2)} %`;}
function cls(status){return({HEALTHY:'healthy',DEGRADED:'degraded',FAILED:'failed'})[status]||'unknown';}

function authoritative(){return flow.trust==='OBSERVED_REMOTE';}

function publishToFailover(){
  const k=globalThis.KICC;
  if(!k?.failoverContext)return;
  const health=evaluateMirrorHealth(flow);
  const accepted=authoritative()&&health.readyForFailover;
  k.failoverContext.syncLagMs=authoritative()&&Number.isFinite(flow.syncLagSec)?flow.syncLagSec*1000:null;
  k.failoverContext.mirrorReady=accepted;
  k.failoverContext.mirrorStatus=authoritative()?health.status:'UNKNOWN';
  k.failoverContext.mirrorLastSuccessAt=authoritative()?flow.lastSuccessAt:null;
  k.failoverContext.mirrorMismatchCount=authoritative()?(flow.mismatchCount24h??null):null;
}

function render(){
  const host=document.getElementById('mirrorHealth');if(!host)return;
  const h=evaluateMirrorHealth(flow),status=authoritative()?h.status:'UNKNOWN';
  const failoverReady=authoritative()&&h.readyForFailover;
  host.innerHTML=`<article class="mirror-card"><div class="migration-head"><div><strong>${flow.name}</strong><small>${flow.sourceId} → ${flow.targetId}</small></div><span class="status-chip ${cls(status)}"><span class="dot"></span>${status}</span></div><div class="mirror-grid"><div><small>Letzter Erfolg</small><strong>${fmtAge(flow.lastSuccessAt)}</strong></div><div><small>Läufe 24h</small><strong>${flow.runCount24h??'—'}</strong></div><div><small>Fehler 24h</small><strong>${flow.errorCount24h??'—'}</strong></div><div><small>Fehlerquote</small><strong>${fmtRate(flow)}</strong></div><div><small>Mismatches</small><strong>${flow.mismatchCount24h??'—'}</strong></div><div><small>Konflikte</small><strong>${flow.conflictCount??'—'}</strong></div><div><small>Sync-Lag</small><strong>${Number.isFinite(flow.syncLagSec)?`${flow.syncLagSec}s`:'—'}</strong></div><div><small>Failover-ready</small><strong>${failoverReady?'JA':'NEIN'}</strong></div></div><div class="db-note">${authoritative()?h.reason:'Keine autoritative Bridge-Telemetrie.'} ${flow.message||''}</div></article>`;
}

function ingest(observation,{manual=false}={}){
  const trust=manual?'MANUAL_TEST':(observation.trust||'UNVERIFIED');
  applyMirrorObservation(flow,{...observation,measuredAt:observation.measuredAt||new Date().toISOString(),trust});
  publishToFailover();render();return flow;
}

async function refresh(){
  try{
    const observation=await bridge.probe();
    applyMirrorObservation(flow,observation);
  }catch(error){
    applyMirrorObservation(flow,{status:'UNKNOWN',measuredAt:new Date().toISOString(),trust:'OBSERVED_ATTEMPT',message:error instanceof Error?error.message:String(error)});
  }
  publishToFailover();render();
}

window.KICC_MIRROR={flow,refresh,health:()=>evaluateMirrorHealth(flow),render,ingestTest(observation){return ingest(observation,{manual:true});}};
if(globalThis.KICC_SYNC_TELEMETRY?.[FLOW_ID])ingest(globalThis.KICC_SYNC_TELEMETRY[FLOW_ID],{manual:true});
else render();
refresh();setInterval(refresh,60000);setInterval(render,15000);
