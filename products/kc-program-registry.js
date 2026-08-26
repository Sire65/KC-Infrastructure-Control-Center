import { makeKcProduct, evaluateProductHealth, dependencySummary } from './kc-product-model.js';
import { impactedProducts, buildImpactMatrix, summarizeImpact } from './impact-analysis.js';

const PROGRAMS=[
  makeKcProduct({id:'kc-dp2',name:'KC DP2',repo:'dp3',kind:'DIENSTPLAN',critical:true,dependencies:{databases:['db-supabase-core'],communication:['kc-communication'],failover:['flow-supabase-neon-core']}}),
  makeKcProduct({id:'kc-dienstplan-legacy',name:'KC Dienstplan · Legacy',repo:'Dienstplan',kind:'DIENSTPLAN_LEGACY',dependencies:{databases:['db-supabase-core']}}),
  makeKcProduct({id:'kc-kasse',name:'KC Marktkasse',repo:'Kasse',kind:'KASSE',critical:true,dependencies:{databases:['db-supabase-core'],communication:['kc-communication'],failover:['flow-supabase-neon-core']}}),
  makeKcProduct({id:'kc-bilder',name:'KC Bilderrechner',repo:'KC-Bilderrechner',kind:'BILDER',dependencies:{databases:['db-supabase-core']}}),
  makeKcProduct({id:'kc-futura',name:'KC Futura Academy',repo:'KC-Futura-Academy',kind:'ACADEMY',critical:true,dependencies:{databases:['db-supabase-futura'],communication:['kc-communication']}}),
  makeKcProduct({id:'kc-communication',name:'KC Communication',repo:'KC-Communication',kind:'COMMUNICATION',critical:true,dependencies:{databases:['db-supabase-core']}}),
  makeKcProduct({id:'kc-communication-public',name:'KC Communication Public',repo:'KC-Communication-Public',kind:'COMMUNICATION_PUBLIC',dependencies:{communication:['kc-communication']}}),
  makeKcProduct({id:'kc-failover-gateway',name:'KC Failover Gateway',repo:'KC-Failover-Gateway',kind:'FAILOVER',critical:true,dependencies:{databases:['db-supabase-core','db-neon-core-mirror'],failover:['flow-supabase-neon-core']}}),
  makeKcProduct({id:'kc-werbewebsite',name:'KC Werbewebsite',repo:'KC-Werbewebsite',kind:'WEBSITE'}),
  makeKcProduct({id:'kc-kuechen-detektiv',name:'KC Küchen-Detektiv',repo:'KC-Kuechen-Detektiv',kind:'GAME'}),
  makeKcProduct({id:'kicc',name:'KICC',repo:'KC-Infrastructure-Control-Center',kind:'CONTROL_CENTER',dependencies:{databases:['db-supabase-core','db-supabase-futura','db-neon-core-mirror'],communication:['kc-communication'],failover:['flow-supabase-neon-core']}})
];

function cls(s){return({HEALTHY:'healthy',DEGRADED:'degraded',FAILED:'failed',MAINTENANCE:'maintenance'})[s]||'unknown';}
function depText(p){const d=dependencySummary(p);return d.count?`${d.count} Abhängigkeiten`:'keine registrierten Abhängigkeiten';}

async function probeRepo(p){
  try{
    const r=await fetch(`https://api.github.com/repos/${p.owner}/${p.repo}`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
    if(r.status===404||r.status===403||r.status===429){Object.assign(p,{repoHealth:'UNKNOWN',measuredAt:new Date().toISOString(),trust:'OBSERVED_ATTEMPT'});return;}
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const d=await r.json();
    Object.assign(p,{repoHealth:d.archived?'DEGRADED':'HEALTHY',measuredAt:new Date().toISOString(),trust:'OBSERVED_REMOTE',visibility:d.visibility,defaultBranch:d.default_branch,lastActivityAt:d.pushed_at});
    const h=evaluateProductHealth(p);p.status=h.status;p.healthReason=h.reason;
  }catch{Object.assign(p,{repoHealth:'UNKNOWN',status:'UNKNOWN',measuredAt:new Date().toISOString(),trust:'OBSERVED_ATTEMPT'});}
}

function applyRuntimeObservation(productId,observation={}){
  const p=PROGRAMS.find(x=>x.id===productId);if(!p)throw new Error('Unknown KC product');
  const allowed=['deploymentUrl','deploymentHealth','telemetryHealth','version','lastActivityAt','measuredAt','trust'];
  for(const key of allowed)if(Object.prototype.hasOwnProperty.call(observation,key))p[key]=observation[key];
  const h=evaluateProductHealth(p);p.status=h.status;p.healthReason=h.reason;render();return p;
}

function render(){
  const host=document.getElementById('kcProgramCards');if(!host)return;
  host.innerHTML=PROGRAMS.map(p=>{const h=evaluateProductHealth(p),d=dependencySummary(p);return`<article class="db-card"><div class="db-title"><span class="status-chip ${cls(h.status)}"><span class="dot"></span>${h.status}</span><strong>${p.name}</strong></div><div class="db-meta"><span>Typ: ${p.kind}${p.critical?' · kritisch':''}</span><span>Repo: ${p.owner}/${p.repo}</span><span>Version: ${p.version||'—'}</span><span>Deployment: ${p.deploymentUrl||'noch nicht registriert'}</span><span>Repo: ${p.repoHealth} · Live: ${p.deploymentHealth} · Telemetrie: ${p.telemetryHealth}</span><span>${depText(p)}</span></div><div class="caps"><span class="cap ${d.databases.length?'available':'unknown'}">DB ${d.databases.length}</span><span class="cap ${d.communication.length?'available':'unknown'}">Kommunikation ${d.communication.length}</span><span class="cap ${d.failover.length?'available':'unknown'}">Failover ${d.failover.length}</span><span class="cap ${d.storage.length?'available':'unknown'}">Storage ${d.storage.length}</span></div><div class="db-note">${h.reason}. Letzte Aktivität: ${p.lastActivityAt?new Date(p.lastActivityAt).toLocaleString('de-DE'):'—'}</div></article>`;}).join('');
}

async function refresh(){await Promise.all(PROGRAMS.map(probeRepo));render();}
window.KICC_PROGRAMS={programs:PROGRAMS,refresh,render,applyRuntimeObservation,impactedBy:resourceId=>impactedProducts(PROGRAMS,resourceId),impact:resourceId=>summarizeImpact(PROGRAMS,resourceId),impactMatrix:()=>buildImpactMatrix(PROGRAMS),summary:()=>PROGRAMS.map(p=>({...p,health:evaluateProductHealth(p),dependencies:dependencySummary(p)}))};
render();refresh();setInterval(refresh,10*60*1000);setInterval(render,30*1000);
