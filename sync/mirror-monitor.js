import { createMirrorFlow, applyMirrorObservation, evaluateMirrorHealth } from './mirror-health-model.js';
import { createMirrorBridgeAdapter } from './mirror-bridge-adapter.js';
import { recordSyncLag, analyzeSyncLag } from './mirror-sync-lag-analysis.js';

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

function fmtAge(ts){if(!ts)return'—';const s=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000));return s<60?`${s} s`:`${Math.round(s/60)} min`;}
function fmtRate(flow){const r=flow.runCount24h??0,e=flow.errorCount24h??0;if(!r)return'—';return `${((e/r)*100).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} %`;}
function fmtSec(v){if(!Number.isFinite(v))return'—';if(v<60)return`${Math.round(v)} s`;return`${(v/60).toLocaleString('de-DE',{minimumFractionDigits:v<600?1:0,maximumFractionDigits:v<600?1:0})} min`;}
function cls(status){return({HEALTHY:'healthy',DEGRADED:'degraded',FAILED:'failed'})[status]||'unknown';}
function mslCls(color){return color==='GREEN'?'healthy':color==='YELLOW'||color==='ORANGE'?'degraded':color==='RED'?'failed':'unknown';}

function authoritative(){return flow.trust==='OBSERVED_REMOTE';}
function currentMsl(){return analyzeSyncLag(Number.isFinite(flow.syncLagSec)?flow.syncLagSec:null);}
function mslLabel(msl){return msl?.recovery?.active?`${msl.label} · ${msl.recovery.clearCount}/${msl.recovery.clearRequired}`:msl?.label||'Keine Messung';}

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
  k.failoverContext.mslAnalysis=authoritative()?currentMsl():null;
}

function render(){
  const host=document.getElementById('mirrorHealth');if(!host)return;
  const h=evaluateMirrorHealth(flow),status=authoritative()?h.status:'UNKNOWN';
  const failoverReady=authoritative()&&h.readyForFailover;
  const msl=currentMsl();
  host.innerHTML=`<article class="mirror-card"><div class="migration-head"><div><strong>${flow.name}</strong><small>${flow.sourceId} → ${flow.targetId}</small></div><span class="status-chip ${cls(status)}"><span class="dot"></span>${status}</span></div><div class="mirror-grid"><div><small>Letzter Erfolg</small><strong>${fmtAge(flow.lastSuccessAt)}</strong></div><div><small>Läufe 24h</small><strong>${flow.runCount24h??'—'}</strong></div><div><small>Fehler 24h</small><strong>${flow.errorCount24h??'—'}</strong></div><div><small>Fehlerquote</small><strong>${fmtRate(flow)}</strong></div><div><small>Mismatches</small><strong>${flow.mismatchCount24h??'—'}</strong></div><div><small>Konflikte</small><strong>${flow.conflictCount??'—'}</strong></div><div><small>Sync-Lag</small><strong>${fmtSec(flow.syncLagSec)}</strong></div><div><small>Failover-ready</small><strong>${failoverReady?'JA':'NEIN'}</strong></div></div><div class="mirror-grid"><div><small>MSL Bewertung</small><strong><span class="status-chip ${mslCls(msl.color)}"><span class="dot"></span>${mslLabel(msl)}</span></strong></div><div><small>Ø 1h</small><strong>${fmtSec(msl.avg1h)}</strong></div><div><small>Max 1h</small><strong>${fmtSec(msl.max1h)}</strong></div><div><small>Trend</small><strong>${msl.trend}</strong></div></div><div class="db-note"><strong>${msl.recommendation}</strong> · ${authoritative()?h.reason:'Keine autoritative Bridge-Telemetrie.'} ${flow.message||''}</div></article>`;
}

function ingest(observation,{manual=false}={}){
  const trust=manual?'MANUAL_TEST':(observation.trust||'UNVERIFIED');
  applyMirrorObservation(flow,{...observation,measuredAt:observation.measuredAt||new Date().toISOString(),trust});
  if(Number.isFinite(flow.syncLagSec))recordSyncLag(flow.syncLagSec,flow.measuredAt||new Date().toISOString());
  publishToFailover();render();return flow;
}

async function refresh(){
  try{
    const observation=await bridge.probe();
    applyMirrorObservation(flow,observation);
    if(Number.isFinite(flow.syncLagSec)&&authoritative())recordSyncLag(flow.syncLagSec,flow.measuredAt||new Date().toISOString());
  }catch(error){
    applyMirrorObservation(flow,{status:'UNKNOWN',measuredAt:new Date().toISOString(),trust:'OBSERVED_ATTEMPT',message:error instanceof Error?error.message:String(error)});
  }
  publishToFailover();render();
}

window.KICC_MIRROR={flow,refresh,health:()=>evaluateMirrorHealth(flow),msl:currentMsl,render,ingestTest(observation){return ingest(observation,{manual:true});}};
if(globalThis.KICC_SYNC_TELEMETRY?.[FLOW_ID])ingest(globalThis.KICC_SYNC_TELEMETRY[FLOW_ID],{manual:true});
else render();
refresh();setInterval(refresh,60000);setInterval(render,15000);
