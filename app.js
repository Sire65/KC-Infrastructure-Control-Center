import { AdapterRegistry, isFresh } from './adapters/adapter-core.js';
import { githubRepositoryAdapter } from './adapters/github-repository-adapter.js';

const VERSION='0.1.0-dev.3';
const MAX_AGE_MS=90_000;
const adapters=new AdapterRegistry();
adapters.register(githubRepositoryAdapter);

const registry=[
  {id:'repo-dp3',type:'REPOSITORY',name:'KC DP2 · dp3',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',adapterId:'github-repository',owner:'Sire65',repo:'dp3'},
  {id:'repo-kasse',type:'REPOSITORY',name:'KC Marktkasse · Kasse',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',adapterId:'github-repository',owner:'Sire65',repo:'Kasse'},
  {id:'repo-bilder',type:'REPOSITORY',name:'KC Bilderrechner',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',adapterId:'github-repository',owner:'Sire65',repo:'KC-Bilderrechner'},
  {id:'repo-futura',type:'REPOSITORY',name:'KC Futura Academy',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',adapterId:'github-repository',owner:'Sire65',repo:'KC-Futura-Academy'},
  {id:'provider-supabase',type:'PROVIDER',name:'Supabase',role:'CONFIGURED',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED'},
  {id:'provider-neon',type:'PROVIDER',name:'Neon',role:'CONFIGURED',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED'}
];

function normalizeStatus(item){
  if(!isFresh(item,MAX_AGE_MS)) return 'UNKNOWN';
  return item.status||'UNKNOWN';
}
function cssStatus(status){return({HEALTHY:'healthy',ONLINE:'healthy',DEGRADED:'degraded',FAILED:'failed',OFFLINE:'failed',MAINTENANCE:'maintenance'})[status]||'unknown'}
function overallStatus(items){
  const observed=items.filter(x=>isFresh(x,MAX_AGE_MS));
  if(!observed.length) return 'UNKNOWN';
  const states=observed.map(normalizeStatus);
  if(states.some(s=>s==='FAILED'||s==='OFFLINE')) return 'FAILED';
  if(states.some(s=>s==='DEGRADED')) return 'DEGRADED';
  return states.every(s=>s==='HEALTHY'||s==='ONLINE')?'HEALTHY':'UNKNOWN';
}
function formatAge(ts){if(!ts)return'nicht gemessen';const sec=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000));return sec<60?`${sec}s alt`:`${Math.round(sec/60)}min alt`}
function render(){
  document.getElementById('version').textContent=VERSION;
  const state=overallStatus(registry),stateEl=document.getElementById('systemState');
  stateEl.className=`system-state ${cssStatus(state)}`;
  stateEl.querySelector('strong').textContent=state==='HEALTHY'?'BETRIEBSBEREIT':state==='FAILED'?'STÖRUNG':state==='DEGRADED'?'EINGESCHRÄNKT':'UNBEKANNT';
  const valid=registry.filter(x=>normalizeStatus(x)!=='UNKNOWN');
  const healthy=registry.filter(x=>['HEALTHY','ONLINE'].includes(normalizeStatus(x))).length;
  const failed=registry.filter(x=>['FAILED','OFFLINE'].includes(normalizeStatus(x))).length;
  const unknown=registry.filter(x=>normalizeStatus(x)==='UNKNOWN').length;
  const latencies=registry.filter(x=>Number.isFinite(x.latencyMs)&&isFresh(x,MAX_AGE_MS)).map(x=>x.latencyMs);
  const avgLatency=latencies.length?Math.round(latencies.reduce((a,b)=>a+b,0)/latencies.length):'—';
  const kpis=[['Bestätigt gesund',healthy,'Komponenten'],['Störungen',failed,'aktuell'],['Unbekannt',unknown,'nicht bestätigt'],['Live-Traffic','—','nur echte Flows'],['Latenz',avgLatency,latencies.length?'ms Ø':'keine Messung'],['Telemetrie',valid.length,'aktuell']];
  document.getElementById('kpis').innerHTML=kpis.map(([l,v,u])=>`<div class="kpi"><small>${l}</small><strong>${v}</strong><em>${u}</em></div>`).join('');
  document.getElementById('registryRows').innerHTML=registry.map(item=>{const status=normalizeStatus(item),cls=cssStatus(status);return`<tr><td><span class="status-chip ${cls}"><span class="dot"></span>${status}</span></td><td>${item.type}</td><td>${item.name}</td><td>${item.role}</td><td>${formatAge(item.measuredAt)}</td><td>${item.trust}</td></tr>`}).join('');
}

async function runDiscovery(){
  const targets=registry.filter(x=>x.adapterId);
  await Promise.all(targets.map(async target=>{
    const obs=await adapters.probe(target.adapterId,target);
    Object.assign(target,obs);
  }));
  render();
}

window.KICC={version:VERSION,registry,adapters:adapters.list(),runDiscovery,ingestObservation(observation){
  const item=registry.find(x=>x.id===observation.targetId);
  if(!item)throw new Error('Unknown registry target');
  Object.assign(item,observation,{measuredAt:observation.measuredAt||new Date().toISOString(),trust:observation.trust||'OBSERVED'});
  render();
}};

render();
runDiscovery();
setInterval(runDiscovery,60_000);
setInterval(render,15_000);

if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
