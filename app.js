import { AdapterRegistry, isFresh } from './adapters/adapter-core.js';
import { githubRepositoryAdapter } from './adapters/github-repository-adapter.js';
import { indexedDbLocalAdapter } from './adapters/indexeddb-local-adapter.js';
import { createTelemetryBridgeAdapter } from './adapters/telemetry-bridge-adapter.js';
import { makeDatabaseResource, summarizeDatabase } from './database/database-model.js';

const VERSION='0.1.0-dev.5';
const MAX_AGE_MS=90_000;
const adapters=new AdapterRegistry();
adapters.register(githubRepositoryAdapter);
adapters.register(indexedDbLocalAdapter);
adapters.register(createTelemetryBridgeAdapter({
  endpointResolver(target){return globalThis.KICC_BRIDGE_ENDPOINTS?.[target.id]||null;}
}));

const registry=[
  {id:'repo-dp3',type:'REPOSITORY',name:'KC DP2 · dp3',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',adapterId:'github-repository',owner:'Sire65',repo:'dp3'},
  {id:'repo-kasse',type:'REPOSITORY',name:'KC Marktkasse · Kasse',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',adapterId:'github-repository',owner:'Sire65',repo:'Kasse'},
  {id:'repo-bilder',type:'REPOSITORY',name:'KC Bilderrechner',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',adapterId:'github-repository',owner:'Sire65',repo:'KC-Bilderrechner'},
  {id:'repo-futura',type:'REPOSITORY',name:'KC Futura Academy',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',adapterId:'github-repository',owner:'Sire65',repo:'KC-Futura-Academy'}
];

const databases=[
  makeDatabaseResource({id:'db-indexeddb-kicc',name:'IndexedDB · KICC Browser-Ursprung',provider:'IndexedDB',role:'LOCAL',scope:'current-origin',adapterId:'indexeddb-local',capabilities:['health','latency','schema','storage']}),
  makeDatabaseResource({id:'db-supabase',name:'Supabase · KC Cloud',provider:'Supabase',role:'UNVERIFIED',scope:'remote',adapterId:'telemetry-bridge',capabilities:['health','latency','reads','writes','storage','schema','policies','integrity','drift','sync','backup','restore','failover','migration']}),
  makeDatabaseResource({id:'db-neon',name:'Neon · KC Cloud',provider:'Neon',role:'UNVERIFIED',scope:'remote',adapterId:'telemetry-bridge',capabilities:['health','latency','reads','writes','storage','schema','policies','integrity','drift','sync','backup','restore','failover','migration']})
];

const allResources=()=>[...registry,...databases];
function normalizeStatus(item){if(!isFresh(item,MAX_AGE_MS))return'UNKNOWN';return item.status||'UNKNOWN'}
function cssStatus(status){return({HEALTHY:'healthy',ONLINE:'healthy',DEGRADED:'degraded',FAILED:'failed',OFFLINE:'failed',MAINTENANCE:'maintenance'})[status]||'unknown'}
function overallStatus(items){const observed=items.filter(x=>isFresh(x,MAX_AGE_MS));if(!observed.length)return'UNKNOWN';const states=observed.map(normalizeStatus);if(states.some(s=>s==='FAILED'||s==='OFFLINE'))return'FAILED';if(states.some(s=>s==='DEGRADED'))return'DEGRADED';return states.every(s=>s==='HEALTHY'||s==='ONLINE')?'HEALTHY':'UNKNOWN'}
function formatAge(ts){if(!ts)return'nicht gemessen';const sec=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000));return sec<60?`${sec}s alt`:`${Math.round(sec/60)}min alt`}
function capabilityBadge(db,cap){const state=summarizeDatabase(db).capabilities.find(x=>x.capability===cap)?.state||'UNSUPPORTED';return `<span class="cap ${state.toLowerCase()}">${cap}: ${state}</span>`}

function renderDatabases(){
  document.getElementById('databaseCards').innerHTML=databases.map(db=>{
    const status=normalizeStatus(db),cls=cssStatus(status);
    const caps=['health','schema','policies','sync','backup','failover'].map(cap=>capabilityBadge(db,cap)).join('');
    const latency=Number.isFinite(db.latencyMs)&&isFresh(db,MAX_AGE_MS)?`${db.latencyMs} ms`:'—';
    const bridge=db.adapterId==='telemetry-bridge'?(globalThis.KICC_BRIDGE_ENDPOINTS?.[db.id]?'Bridge konfiguriert':'Bridge nicht konfiguriert'):'lokale Messung';
    return `<article class="db-card"><div class="db-title"><span class="status-chip ${cls}"><span class="dot"></span>${status}</span><strong>${db.name}</strong></div><div class="db-meta"><span>Rolle: ${db.role}</span><span>Latenz: ${latency}</span><span>Messung: ${formatAge(db.measuredAt)}</span><span>${bridge}</span></div><div class="caps">${caps}</div><div class="db-note">${db.message||'Noch keine sichere Live-Messung vorhanden.'}</div></article>`;
  }).join('');
}

function render(){
  document.getElementById('version').textContent=VERSION;
  const resources=allResources(),state=overallStatus(resources),stateEl=document.getElementById('systemState');
  stateEl.className=`system-state ${cssStatus(state)}`;
  stateEl.querySelector('strong').textContent=state==='HEALTHY'?'BETRIEBSBEREIT':state==='FAILED'?'STÖRUNG':state==='DEGRADED'?'EINGESCHRÄNKT':'UNBEKANNT';
  const valid=resources.filter(x=>normalizeStatus(x)!=='UNKNOWN');
  const healthy=resources.filter(x=>['HEALTHY','ONLINE'].includes(normalizeStatus(x))).length;
  const failed=resources.filter(x=>['FAILED','OFFLINE'].includes(normalizeStatus(x))).length;
  const unknown=resources.filter(x=>normalizeStatus(x)==='UNKNOWN').length;
  const latencies=resources.filter(x=>Number.isFinite(x.latencyMs)&&isFresh(x,MAX_AGE_MS)).map(x=>x.latencyMs);
  const avgLatency=latencies.length?Math.round(latencies.reduce((a,b)=>a+b,0)/latencies.length):'—';
  const bridgeCount=databases.filter(x=>x.adapterId==='telemetry-bridge'&&globalThis.KICC_BRIDGE_ENDPOINTS?.[x.id]).length;
  const kpis=[['Bestätigt gesund',healthy,'Komponenten'],['Störungen',failed,'aktuell'],['Unbekannt',unknown,'nicht bestätigt'],['DB Bridges',bridgeCount,'von 2 remote'],['Latenz',avgLatency,latencies.length?'ms Ø':'keine Messung'],['Telemetrie',valid.length,'aktuell']];
  document.getElementById('kpis').innerHTML=kpis.map(([l,v,u])=>`<div class="kpi"><small>${l}</small><strong>${v}</strong><em>${u}</em></div>`).join('');
  document.getElementById('registryRows').innerHTML=resources.map(item=>{const status=normalizeStatus(item),cls=cssStatus(status);return`<tr><td><span class="status-chip ${cls}"><span class="dot"></span>${status}</span></td><td>${item.type}</td><td>${item.name}</td><td>${item.role}</td><td>${formatAge(item.measuredAt)}</td><td>${item.trust}</td></tr>`}).join('');
  renderDatabases();
}

async function runDiscovery(){
  const targets=allResources().filter(x=>x.adapterId);
  await Promise.all(targets.map(async target=>{const obs=await adapters.probe(target.adapterId,target);Object.assign(target,obs)}));
  render();
}

window.KICC={version:VERSION,registry,databases,adapters:adapters.list(),runDiscovery,databaseSummary:()=>databases.map(summarizeDatabase),bridgeConfigured:id=>Boolean(globalThis.KICC_BRIDGE_ENDPOINTS?.[id]),ingestObservation(observation){
  const item=allResources().find(x=>x.id===observation.targetId);if(!item)throw new Error('Unknown registry target');Object.assign(item,observation,{measuredAt:observation.measuredAt||new Date().toISOString(),trust:observation.trust||'OBSERVED'});render();
}};

render();runDiscovery();setInterval(runDiscovery,60_000);setInterval(render,15_000);
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
