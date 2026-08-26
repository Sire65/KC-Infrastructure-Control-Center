import { createMirrorFlow, applyMirrorObservation, evaluateMirrorHealth } from './mirror-health-model.js';

const flow=createMirrorFlow({id:'flow-supabase-neon-core',sourceId:'db-supabase-core',targetId:'db-neon-core-mirror',name:'KC Core · Supabase ↔ Neon Mirror',requiredForFailover:true,maxAgeMs:120000});

function fmtAge(ts){if(!ts)return'—';const s=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000));return s<60?`${s}s`:`${Math.round(s/60)}min`;}
function fmtRate(flow){const r=flow.runCount24h??0,e=flow.errorCount24h??0;if(!r)return'—';return `${((e/r)*100).toFixed(2)} %`;}
function cls(status){return({HEALTHY:'healthy',DEGRADED:'degraded',FAILED:'failed'})[status]||'unknown';}

function publishToFailover(){
  const k=globalThis.KICC;
  if(!k?.failoverContext)return;
  const health=evaluateMirrorHealth(flow);
  k.failoverContext.syncLagMs=Number.isFinite(flow.syncLagSec)?flow.syncLagSec*1000:null;
  k.failoverContext.mirrorReady=health.readyForFailover;
  k.failoverContext.mirrorStatus=health.status;
  k.failoverContext.mirrorLastSuccessAt=flow.lastSuccessAt;
  k.failoverContext.mirrorMismatchCount=flow.mismatchCount24h??null;
}

function render(){
  const host=document.getElementById('mirrorHealth');if(!host)return;
  const h=evaluateMirrorHealth(flow),status=h.status;
  host.innerHTML=`<article class="mirror-card"><div class="migration-head"><div><strong>${flow.name}</strong><small>${flow.sourceId} → ${flow.targetId}</small></div><span class="status-chip ${cls(status)}"><span class="dot"></span>${status}</span></div><div class="mirror-grid"><div><small>Letzter Erfolg</small><strong>${fmtAge(flow.lastSuccessAt)}</strong></div><div><small>Läufe 24h</small><strong>${flow.runCount24h??'—'}</strong></div><div><small>Fehler 24h</small><strong>${flow.errorCount24h??'—'}</strong></div><div><small>Fehlerquote</small><strong>${fmtRate(flow)}</strong></div><div><small>Mismatches</small><strong>${flow.mismatchCount24h??'—'}</strong></div><div><small>Konflikte</small><strong>${flow.conflictCount??'—'}</strong></div><div><small>Sync-Lag</small><strong>${Number.isFinite(flow.syncLagSec)?`${flow.syncLagSec}s`:'—'}</strong></div><div><small>Failover-ready</small><strong>${h.readyForFailover?'JA':'NEIN'}</strong></div></div><div class="db-note">${h.reason}. ${flow.message||''}</div></article>`;
}

function ingest(observation){
  applyMirrorObservation(flow,{...observation,measuredAt:observation.measuredAt||new Date().toISOString(),trust:observation.trust||'OBSERVED'});
  publishToFailover();render();return flow;
}

window.KICC_MIRROR={flow,ingest,health:()=>evaluateMirrorHealth(flow),render};
if(globalThis.KICC_SYNC_TELEMETRY?.['flow-supabase-neon-core'])ingest(globalThis.KICC_SYNC_TELEMETRY['flow-supabase-neon-core']);
else render();
setInterval(render,15000);
