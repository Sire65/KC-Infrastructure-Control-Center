import { AdapterRegistry, isFresh } from './adapters/adapter-core.js';
import { githubRepositoryAdapter } from './adapters/github-repository-adapter.js';
import { indexedDbLocalAdapter } from './adapters/indexeddb-local-adapter.js';
import { createTelemetryBridgeAdapter } from './adapters/telemetry-bridge-adapter.js';
import { makeDatabaseResource, summarizeDatabase } from './database/database-model.js';
import { evaluateFailoverState, failoverRules } from './failover/failover-state-machine.js';

const VERSION='0.1.0-dev.11';
const MAX_AGE_MS=90_000;

const BRIDGE_ENDPOINTS={
  'db-supabase-core':'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kicc-telemetry',
  'db-supabase-futura':'https://iddudrxuihdodnvejxcp.supabase.co/functions/v1/kicc-telemetry'
};

async function bridgeAuthResolver(target){
  if(!target.id.startsWith('db-supabase-')) return null;
  if(typeof globalThis.KICC_AUTH?.getSupabaseBridgeAuth==='function') return await globalThis.KICC_AUTH.getSupabaseBridgeAuth(target.id);
  return null;
}

const adapters=new AdapterRegistry();
adapters.register(githubRepositoryAdapter);
adapters.register(indexedDbLocalAdapter);
adapters.register(createTelemetryBridgeAdapter({
  endpointResolver(target){return BRIDGE_ENDPOINTS[target.id]||globalThis.KICC_BRIDGE_ENDPOINTS?.[target.id]||null;},
  authResolver:bridgeAuthResolver
}));

const registry=[
  {id:'repo-dp3',type:'REPOSITORY',name:'KC DP2 · dp3',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',adapterId:'github-repository',owner:'Sire65',repo:'dp3'},
  {id:'repo-kasse',type:'REPOSITORY',name:'KC Marktkasse · Kasse',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',adapterId:'github-repository',owner:'Sire65',repo:'Kasse'},
  {id:'repo-bilder',type:'REPOSITORY',name:'KC Bilderrechner',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',adapterId:'github-repository',owner:'Sire65',repo:'KC-Bilderrechner'},
  {id:'repo-futura',type:'REPOSITORY',name:'KC Futura Academy',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',adapterId:'github-repository',owner:'Sire65',repo:'KC-Futura-Academy'}
];

const remoteCaps=['health','latency','reads','writes','storage','schema','policies','integrity','drift','sync','backup','restore','failover','migration'];
const databases=[
  makeDatabaseResource({id:'db-indexeddb-kicc',name:'IndexedDB · KICC Browser-Ursprung',provider:'IndexedDB',role:'LOCAL',scope:'current-origin',adapterId:'indexeddb-local',capabilities:['health','latency','schema','storage']}),
  makeDatabaseResource({id:'db-supabase-core',name:'Supabase · KC Core · London',provider:'Supabase',role:'PRIMARY',scope:'eu-west-2',adapterId:'telemetry-bridge',capabilities:remoteCaps}),
  makeDatabaseResource({id:'db-supabase-futura',name:'Supabase · Future Academy · Frankfurt',provider:'Supabase',role:'PRIMARY',scope:'eu-central-1',adapterId:'telemetry-bridge',capabilities:remoteCaps}),
  makeDatabaseResource({id:'db-neon-core-mirror',name:'Neon · KC Core Mirror · London',provider:'Neon',role:'MIRROR/STANDBY',scope:'aws-eu-west-2',adapterId:'telemetry-bridge',capabilities:remoteCaps})
];

const failoverContext={syncLagMs:null,resyncComplete:false,verificationPassed:false,failbackApproved:false,neonPromoted:false};
const allResources=()=>[...registry,...databases];
function dbById(id){return databases.find(x=>x.id===id)||null;}
function normalizeStatus(item){if(!isFresh(item,MAX_AGE_MS))return'UNKNOWN';return item.status||'UNKNOWN'}
function cssStatus(status){return({HEALTHY:'healthy',ONLINE:'healthy',DEGRADED:'degraded',FAILED:'failed',OFFLINE:'failed',MAINTENANCE:'maintenance'})[status]||'unknown'}
function overallStatus(items){const observed=items.filter(x=>isFresh(x,MAX_AGE_MS));if(!observed.length)return'UNKNOWN';const states=observed.map(normalizeStatus);if(states.some(s=>s==='FAILED'||s==='OFFLINE'))return'FAILED';if(states.some(s=>s==='DEGRADED'))return'DEGRADED';return states.every(s=>s==='HEALTHY'||s==='ONLINE')?'HEALTHY':'UNKNOWN'}
function formatAge(ts){if(!ts)return'nicht gemessen';const sec=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000));return sec<60?`${sec}s alt`:`${Math.round(sec/60)}min alt`}
function capabilityBadge(db,cap){const state=summarizeDatabase(db).capabilities.find(x=>x.capability===cap)?.state||'UNSUPPORTED';return `<span class="cap ${state.toLowerCase()}">${cap}: ${state}</span>`}
function bridgeEndpointFor(db){return BRIDGE_ENDPOINTS[db.id]||globalThis.KICC_BRIDGE_ENDPOINTS?.[db.id]||null;}

function currentFailoverState(){
  const supabase=dbById('db-supabase-core');const neon=dbById('db-neon-core-mirror');
  const base=evaluateFailoverState({supabaseHealth:supabase?normalizeStatus(supabase):'UNKNOWN',neonHealth:neon?normalizeStatus(neon):'UNKNOWN',syncLagMs:failoverContext.syncLagMs,resyncComplete:failoverContext.resyncComplete,verificationPassed:failoverContext.verificationPassed,failbackApproved:failoverContext.failbackApproved});
  if(failoverContext.neonPromoted&&['NORMAL','DEGRADED','FAILOVER_PENDING'].includes(base.state)){
    if(['HEALTHY','ONLINE'].includes(supabase?normalizeStatus(supabase):'UNKNOWN'))return{state:'RESYNC_REQUIRED',primary:'NEON',candidatePrimary:'SUPABASE',reason:'Supabase zurück; Neon bleibt PRIMARY bis Rücksynchronisierung und Verifikation abgeschlossen sind'};
    return{state:'NEON_PRIMARY',primary:'NEON',candidatePrimary:'SUPABASE',reason:'Neon ist während des Supabase-Ausfalls authoritative PRIMARY'};
  }
  return base;
}

function renderFailover(){
  const state=currentFailoverState();const rules=failoverRules();const actions=[];
  if(state.state==='FAILOVER_PENDING')actions.push('Neon-Promotion vorbereiten und nach Recovery-/Freshness-Prüfung freigeben');
  if(state.state==='NEON_PRIMARY')actions.push('Neon bleibt PRIMARY; Supabase darf nicht gleichzeitig schreibend PRIMARY sein');
  if(state.state==='RESYNC_REQUIRED')actions.push('Rücksynchronisierung Neon → Supabase vorbereiten');
  if(state.state==='VERIFYING')actions.push('Daten-, Schema- und Integritätsvergleich abschließen');
  if(state.state==='FAILBACK_READY')actions.push('Failback zu Supabase kann nach Freigabe erfolgen');
  if(state.state==='BLOCKED')actions.push('Failover blockiert: Ursache prüfen');
  document.getElementById('approvalCount').textContent=String(actions.length);
  document.getElementById('actions').innerHTML=actions.length?`<div class="action-stack"><strong>${state.state}</strong><span>Aktiv: ${state.primary||'—'}</span><span>${state.reason}</span>${actions.map(x=>`<div class="action-item">${x}</div>`).join('')}<small>${rules.invariants[0]} ${rules.invariants[1]}</small></div>`:'<div class="empty-list">Kein aktueller Failover-Handlungsbedarf.</div>';
  const topology=document.getElementById('topology');topology.className='topology';topology.innerHTML=`<div class="failover-topology"><div class="flow-node">Supabase<br><small>${normalizeStatus(dbById('db-supabase-core')||{})}</small></div><div class="flow-arrow"><strong>${state.primary==='NEON'?'←':'→'}</strong><small>${state.primary==='NEON'?'Resync/Failover':'Mirror'}</small></div><div class="flow-node">Neon<br><small>${normalizeStatus(dbById('db-neon-core-mirror')||{})}</small></div><div class="flow-state"><strong>${state.state}</strong><small>${state.reason}</small></div></div>`;
}

function renderDatabases(){document.getElementById('databaseCards').innerHTML=databases.map(db=>{const status=normalizeStatus(db),cls=cssStatus(status);const caps=['health','schema','policies','sync','backup','failover'].map(cap=>capabilityBadge(db,cap)).join('');const latency=Number.isFinite(db.latencyMs)&&isFresh(db,MAX_AGE_MS)?`${db.latencyMs} ms`:'—';const bridge=db.adapterId==='telemetry-bridge'?(bridgeEndpointFor(db)?'Bridge bereit':'Bridge noch nicht angebunden'):'lokale Messung';return `<article class="db-card"><div class="db-title"><span class="status-chip ${cls}"><span class="dot"></span>${status}</span><strong>${db.name}</strong></div><div class="db-meta"><span>Rolle: ${db.role}</span><span>Region: ${db.scope}</span><span>Latenz: ${latency}</span><span>Messung: ${formatAge(db.measuredAt)}</span><span>${bridge}</span></div><div class="caps">${caps}</div><div class="db-note">${db.message||'Noch keine sichere Live-Messung vorhanden.'}</div></article>`;}).join('');}

function render(){
  document.getElementById('version').textContent=VERSION;const resources=allResources(),state=overallStatus(resources),stateEl=document.getElementById('systemState');stateEl.className=`system-state ${cssStatus(state)}`;stateEl.querySelector('strong').textContent=state==='HEALTHY'?'BETRIEBSBEREIT':state==='FAILED'?'STÖRUNG':state==='DEGRADED'?'EINGESCHRÄNKT':'UNBEKANNT';
  const valid=resources.filter(x=>normalizeStatus(x)!=='UNKNOWN');const healthy=resources.filter(x=>['HEALTHY','ONLINE'].includes(normalizeStatus(x))).length;const failed=resources.filter(x=>['FAILED','OFFLINE'].includes(normalizeStatus(x))).length;const unknown=resources.filter(x=>normalizeStatus(x)==='UNKNOWN').length;const bridgeCount=databases.filter(x=>x.adapterId==='telemetry-bridge'&&bridgeEndpointFor(x)).length;const f=currentFailoverState();const kpis=[['Bestätigt gesund',healthy,'Komponenten'],['Störungen',failed,'aktuell'],['Unbekannt',unknown,'nicht bestätigt'],['DB Bridges',bridgeCount,'remote bereit'],['Primär-DB',f.primary||'—',f.state],['Telemetrie',valid.length,'aktuell']];document.getElementById('kpis').innerHTML=kpis.map(([l,v,u])=>`<div class="kpi"><small>${l}</small><strong>${v}</strong><em>${u}</em></div>`).join('');document.getElementById('registryRows').innerHTML=resources.map(item=>{const status=normalizeStatus(item),cls=cssStatus(status);return`<tr><td><span class="status-chip ${cls}"><span class="dot"></span>${status}</span></td><td>${item.type}</td><td>${item.name}</td><td>${item.role}</td><td>${formatAge(item.measuredAt)}</td><td>${item.trust}</td></tr>`}).join('');renderDatabases();renderFailover();}

async function runDiscovery(){const targets=allResources().filter(x=>x.adapterId);await Promise.all(targets.map(async target=>{const obs=await adapters.probe(target.adapterId,target);Object.assign(target,obs)}));render();}

window.KICC={version:VERSION,registry,databases,failoverContext,adapters:adapters.list(),runDiscovery,currentFailoverState,failoverRules:failoverRules(),databaseSummary:()=>databases.map(summarizeDatabase),bridgeConfigured:id=>Boolean(BRIDGE_ENDPOINTS[id]||globalThis.KICC_BRIDGE_ENDPOINTS?.[id]),markNeonPromoted(){failoverContext.neonPromoted=true;render();},setResyncProgress({syncLagMs=null,resyncComplete=false,verificationPassed=false,failbackApproved=false}={}){Object.assign(failoverContext,{syncLagMs,resyncComplete,verificationPassed,failbackApproved});render();},ingestObservation(observation){const item=allResources().find(x=>x.id===observation.targetId);if(!item)throw new Error('Unknown registry target');Object.assign(item,observation,{measuredAt:observation.measuredAt||new Date().toISOString(),trust:observation.trust||'OBSERVED'});render();}};
render();runDiscovery();setInterval(runDiscovery,60_000);setInterval(render,15_000);if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
