import { AdapterRegistry, isFresh } from './adapters/adapter-core.js';
import { indexedDbLocalAdapter } from './adapters/indexeddb-local-adapter.js';
import { browserRuntimeAdapter } from './adapters/browser-runtime-adapter.js';
import { createTelemetryBridgeAdapter } from './adapters/telemetry-bridge-adapter.js';
import { makeDatabaseResource, summarizeDatabase } from './database/database-model.js';
import { evaluateFailoverState, failoverRules } from './failover/failover-state-machine.js';
import { evaluateSystemHealth, normalizedResourceStatus, resourceMaxAge } from './health/system-health.js';
import { ProbeScheduler } from './runtime/probe-scheduler.js';
import { DOMAIN, markDomain } from './scope/domain-model.js';

const VERSION='0.1.0-dev.65';
const DEFAULT_MAX_AGE_MS=90_000;

const BRIDGE_ENDPOINTS={
  'db-supabase-core':'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kicc-telemetry',
  'db-supabase-futura':'https://iddudrxuihdodnvejxcp.supabase.co/functions/v1/kicc-telemetry'
};

async function bridgeAuthResolver(target){
  if(target.id.startsWith('db-supabase-')&&typeof globalThis.KICC_AUTH?.getSupabaseBridgeAuth==='function') return await globalThis.KICC_AUTH.getSupabaseBridgeAuth(target.id);
  if(target.id.startsWith('db-neon-')&&typeof globalThis.KICC_AUTH?.getNeonBridgeAuth==='function') return await globalThis.KICC_AUTH.getNeonBridgeAuth(target.id);
  return null;
}

const adapters=new AdapterRegistry();
adapters.register(indexedDbLocalAdapter);
adapters.register(browserRuntimeAdapter);
adapters.register(createTelemetryBridgeAdapter({
  endpointResolver(target){return BRIDGE_ENDPOINTS[target.id]||globalThis.KICC_BRIDGE_ENDPOINTS?.[target.id]||null;},
  authResolver:bridgeAuthResolver
}));
const scheduler=new ProbeScheduler();

const registry=[markDomain({
  id:'runtime-kicc-browser',type:'RUNTIME',name:'KICC Browser Runtime',role:'LOCAL_RUNTIME',provider:'Browser',scope:'current-origin',
  adapterId:'browser-runtime',requiredForOverall:false,refreshMs:30_000,maxAgeMs:90_000,status:'UNKNOWN',trust:'UNVERIFIED',measuredAt:null,
  capabilities:['health','latency','memory','storage','network','serviceWorker','visibility','version']
},DOMAIN.KC)];
const remoteCaps=['health','latency','reads','writes','storage','schema','policies','integrity','drift','sync','backup','restore','failover','migration'];
function db(config,domain=DOMAIN.KC){return markDomain(Object.assign(makeDatabaseResource(config),{requiredForOverall:Boolean(config.requiredForOverall),refreshMs:config.refreshMs??60_000,maxAgeMs:config.maxAgeMs??120_000}),domain);}
const databases=[
  db({id:'db-indexeddb-kicc',name:'IndexedDB · KICC Browser-Ursprung',provider:'IndexedDB',role:'LOCAL',scope:'current-origin',adapterId:'indexeddb-local',capabilities:['health','latency','schema','storage'],requiredForOverall:false,refreshMs:60_000,maxAgeMs:120_000}),
  db({id:'db-supabase-core',name:'Supabase · KC Core · London',provider:'Supabase',role:'PRIMARY',scope:'eu-west-2',adapterId:'telemetry-bridge',capabilities:remoteCaps,requiredForOverall:true}),
  db({id:'db-supabase-futura',name:'Supabase · Future Academy · Frankfurt',provider:'Supabase',role:'PRIMARY',scope:'eu-central-1',adapterId:'telemetry-bridge',capabilities:remoteCaps,requiredForOverall:true}),
  db({id:'db-neon-core-mirror',name:'Neon · KC Core Mirror · London',provider:'Neon',role:'MIRROR/STANDBY',scope:'aws-eu-west-2',adapterId:'telemetry-bridge',capabilities:remoteCaps,requiredForOverall:true})
];
const privateDatabases=[db({id:'db-neon-pc-backup',name:'Neon · PC Backup Vault · USA West',provider:'Neon',role:'BACKUP_CATALOG',scope:'aws-us-west-2',adapterId:'telemetry-bridge',capabilities:remoteCaps,requiredForOverall:false},DOMAIN.PRIVATE)];
const failoverContext={syncLagMs:null,mirrorReady:null,mirrorStatus:'UNKNOWN',mirrorLastSuccessAt:null,mirrorMismatchCount:null,resyncComplete:false,verificationPassed:false,failbackApproved:false,neonPromoted:false};
const allResources=()=>[...registry,...databases];
const allProbeTargets=()=>[...allResources(),...privateDatabases];
const dbById=id=>databases.find(x=>x.id===id)||null;
const normalizeStatus=item=>normalizedResourceStatus(item,adapters,isFresh,DEFAULT_MAX_AGE_MS);
function cssStatus(status){return({HEALTHY:'healthy',ONLINE:'healthy',DEGRADED:'degraded',FAILED:'failed',OFFLINE:'failed',MAINTENANCE:'maintenance'})[status]||'unknown';}
function formatAge(ts){if(!ts)return'nicht gemessen';const sec=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000));return sec<60?`${sec}s alt`:`${Math.round(sec/60)}min alt`;}
function capabilityBadge(dbItem,cap){const state=summarizeDatabase(dbItem).capabilities.find(x=>x.capability===cap)?.state||'UNSUPPORTED';return `<span class="cap ${state.toLowerCase()}">${cap}: ${state}</span>`;}
function bridgeEndpointFor(dbItem){return BRIDGE_ENDPOINTS[dbItem.id]||globalThis.KICC_BRIDGE_ENDPOINTS?.[dbItem.id]||null;}
function currentFailoverState(){
  const supabase=dbById('db-supabase-core'),neon=dbById('db-neon-core-mirror');
  return evaluateFailoverState({
    supabaseHealth:supabase?normalizeStatus(supabase):'UNKNOWN',
    neonHealth:neon?normalizeStatus(neon):'UNKNOWN',
    syncLagMs:failoverContext.syncLagMs,
    mirrorReady:failoverContext.mirrorReady,
    resyncComplete:failoverContext.resyncComplete,
    verificationPassed:failoverContext.verificationPassed,
    failbackApproved:failoverContext.failbackApproved,
    neonWasPrimary:failoverContext.neonPromoted===true
  });
}
function renderFailover(){
  const state=currentFailoverState(),rules=failoverRules(),actions=[];
  if(state.state==='FAILOVER_PENDING')actions.push('Neon-Promotion vorbereiten und nach Recovery-/Freshness-Prüfung freigeben');
  if(state.state==='NEON_PRIMARY')actions.push('Neon bleibt PRIMARY; Supabase darf nicht gleichzeitig schreibend PRIMARY sein');
  if(state.state==='RESYNC_REQUIRED')actions.push('Rücksynchronisierung Neon → Supabase vorbereiten');
  if(state.state==='DEGRADED'&&state.primary==='SUPABASE'&&Number.isFinite(failoverContext.syncLagMs)&&failoverContext.syncLagMs>0)actions.push('Mirror-Sync-Lag prüfen; Supabase bleibt PRIMARY');
  if(state.state==='VERIFYING')actions.push('Daten-, Schema- und Integritätsvergleich abschließen');
  if(state.state==='FAILBACK_READY')actions.push('Failback zu Supabase kann nach Freigabe erfolgen');
  if(state.state==='BLOCKED')actions.push('Failover blockiert: Mirror-Frische, Integrität oder Datenbankstatus prüfen');
  const securityActions=globalThis.KICC_SECURITY?.actions?.()||[];
  document.getElementById('approvalCount').textContent=String(actions.length+securityActions.length);
  const failoverHtml=actions.map(x=>`<div class="action-item">${x}</div>`).join('');
  const securityHtml=securityActions.slice(0,8).map(x=>`<div class="action-item"><strong>${x.severity} · Security</strong><br>${x.title}<br><small>${x.detail}</small></div>`).join('');
  document.getElementById('actions').innerHTML=(actions.length||securityActions.length)?`<div class="action-stack"><strong>${state.state}</strong><span>Aktiv: ${state.primary||'—'}</span><span>${state.reason}</span>${failoverHtml}${securityHtml}<small>${rules.invariants[0]} ${rules.invariants[1]}</small></div>`:'<div class="empty-list">Kein aktueller Handlungsbedarf.</div>';
  const topology=document.getElementById('topology');topology.className='topology';topology.innerHTML=`<div class="failover-topology"><div class="flow-node">Supabase<br><small>${normalizeStatus(dbById('db-supabase-core')||{})}</small></div><div class="flow-arrow"><strong>${state.primary==='NEON'?'←':'→'}</strong><small>${state.primary==='NEON'?'Resync/Failover':'Mirror'} · ${failoverContext.mirrorStatus||'UNKNOWN'}</small></div><div class="flow-node">Neon<br><small>${normalizeStatus(dbById('db-neon-core-mirror')||{})}</small></div><div class="flow-state"><strong>${state.state}</strong><small>${state.reason}</small></div></div>`;
}
function renderDatabases(){document.getElementById('databaseCards').innerHTML=databases.map(item=>{const status=normalizeStatus(item),cls=cssStatus(status),caps=['health','schema','policies','sync','backup','failover'].map(cap=>capabilityBadge(item,cap)).join(''),latency=Number.isFinite(item.latencyMs)&&isFresh(item,resourceMaxAge(item,adapters,DEFAULT_MAX_AGE_MS))?`${item.latencyMs} ms`:'—',bridge=item.adapterId==='telemetry-bridge'?(bridgeEndpointFor(item)?'Bridge bereit':'Bridge noch nicht angebunden'):'lokale Messung';return `<article class="db-card"><div class="db-title"><span class="status-chip ${cls}"><span class="dot"></span>${status}</span><strong>${item.name}</strong></div><div class="db-meta"><span>Bereich: KC</span><span>Rolle: ${item.role}${item.requiredForOverall?' · kritisch':''}</span><span>Region: ${item.scope}</span><span>Latenz: ${latency}</span><span>Messung: ${formatAge(item.measuredAt)}</span><span>${bridge}</span></div><div class="caps">${caps}</div><div class="db-note">${item.message||item.detail||'Noch keine sichere Live-Messung vorhanden.'}</div></article>`;}).join('');}
function render(){
  document.getElementById('version').textContent=VERSION;const resources=allResources(),health=evaluateSystemHealth(resources,{adapters,isFreshFn:isFresh,fallbackMs:DEFAULT_MAX_AGE_MS}),state=health.status,stateEl=document.getElementById('systemState');stateEl.className=`system-state ${cssStatus(state)}`;stateEl.querySelector('strong').textContent=state==='HEALTHY'?'BETRIEBSBEREIT':state==='FAILED'?'STÖRUNG':state==='DEGRADED'?'EINGESCHRÄNKT':'UNBEKANNT';
  const healthy=resources.filter(x=>['HEALTHY','ONLINE'].includes(normalizeStatus(x))).length,failed=resources.filter(x=>['FAILED','OFFLINE'].includes(normalizeStatus(x))).length,unknown=resources.filter(x=>normalizeStatus(x)==='UNKNOWN').length,f=currentFailoverState();
  const mirrorLabel=failoverContext.mirrorReady===true?'READY':failoverContext.mirrorReady===false?'NICHT READY':'UNKNOWN';
  const kpis=[['Bestätigt gesund',healthy,'KC-Komponenten'],['Störungen',failed,'KC aktuell'],['Unbekannt',unknown,'KC nicht bestätigt'],['Abdeckung',`${health.coverage}%`,`${health.unknownRequired} kritisch unbekannt`],['Mirror',mirrorLabel,failoverContext.mirrorStatus],['Primär-DB',f.primary||'—',f.state]];
  document.getElementById('kpis').innerHTML=kpis.map(([l,v,u])=>`<div class="kpi"><small>${l}</small><strong>${v}</strong><em>${u}</em></div>`).join('');
  document.getElementById('registryRows').innerHTML=resources.map(item=>{const status=normalizeStatus(item),cls=cssStatus(status);return`<tr><td><span class="status-chip ${cls}"><span class="dot"></span>${status}</span></td><td>${item.type}</td><td>${item.name}</td><td>${item.role}${item.requiredForOverall?' · kritisch':''}</td><td>${formatAge(item.measuredAt)}</td><td>${item.trust}</td></tr>`;}).join('');renderDatabases();renderFailover();globalThis.KICC_PRIVATE_INFRA?.render?.();globalThis.KICC_DASHBOARD_INSTRUMENTS?.render?.();
}
async function runDiscovery({force=false,includePrivate=true}={}){const targets=(includePrivate?allProbeTargets():allResources()).filter(x=>x.adapterId),due=force?targets:scheduler.dueTargets(targets,adapters);await Promise.all(due.map(async target=>{scheduler.markAttempt(target.id);const obs=await adapters.probe(target.adapterId,target);Object.assign(target,obs);}));render();}
window.KICC={version:VERSION,registry,databases,privateDatabases,failoverContext,adapters:adapters.list(),runDiscovery,currentFailoverState,failoverRules:failoverRules(),kcResources:allResources,privateResources:()=>[...privateDatabases],systemHealth:()=>evaluateSystemHealth(allResources(),{adapters,isFreshFn:isFresh,fallbackMs:DEFAULT_MAX_AGE_MS}),databaseSummary:()=>databases.map(summarizeDatabase),bridgeConfigured:id=>Boolean(BRIDGE_ENDPOINTS[id]||globalThis.KICC_BRIDGE_ENDPOINTS?.[id]),telemetry:()=>allProbeTargets().map(x=>({id:x.id,type:x.type,status:normalizeStatus(x),trust:x.trust,measuredAt:x.measuredAt,latencyMs:x.latencyMs??null,metrics:x.metrics||null})),markNeonPromoted(){if(failoverContext.mirrorReady!==true)throw new Error('Neon promotion blocked: mirror readiness not confirmed');failoverContext.neonPromoted=true;render();},setResyncProgress({syncLagMs=null,resyncComplete=false,verificationPassed=false,failbackApproved=false}={}){Object.assign(failoverContext,{syncLagMs,resyncComplete,verificationPassed,failbackApproved});render();},ingestObservation(observation){const item=allProbeTargets().find(x=>x.id===observation.targetId);if(!item)throw new Error('Unknown registry target');Object.assign(item,observation,{measuredAt:observation.measuredAt||new Date().toISOString(),trust:observation.trust||'UNVERIFIED'});render();}};
render();runDiscovery({force:true});setInterval(()=>runDiscovery(),30_000);setInterval(render,15_000);
