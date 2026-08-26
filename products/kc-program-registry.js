import { makeKcProduct, evaluateProductHealth, dependencySummary, REPOSITORY_STATE } from './kc-product-model.js';
import { impactedProducts, buildImpactMatrix, summarizeImpact } from './impact-analysis.js';

// Offene KC-Produkt-Registry: Ein KC-Programm darf auch ohne GitHub-Repository registriert sein.
// Repository-Verfügbarkeit, Deployment und Runtime-Health sind getrennte Wahrheiten.
const PROGRAMS=[
  makeKcProduct({id:'kc-bilderkasse',name:'KC Bilderkasse',repo:'Kasse',kind:'KASSE_UI',critical:true,notes:'Neuere Bilderkassen-/MarktKasse-Suite; Build/Runtime muss separat verifiziert werden.',dependencies:{databases:['db-supabase-core'],communication:['kc-communication'],failover:['flow-supabase-neon-core']}}),
  makeKcProduct({id:'kc-kasse-legacy',name:'KC Marktkasse · Legacy/Root',repo:'Kasse',kind:'KASSE_LEGACY',notes:'Älterer veröffentlichter Root-Stand; Security-Befunde nicht auf Bilderkasse übertragen.',dependencies:{databases:['db-supabase-core']}}),
  makeKcProduct({id:'kc-pc-manager',name:'KC PC Manager',repo:'Kasse',kind:'PC_MANAGER',critical:true,notes:'Als eigene KC-Anwendung geführt; Quellbestand liegt derzeit innerhalb der MarktKasse-Suite.',dependencies:{databases:['db-supabase-core'],communication:['kc-communication'],failover:['flow-supabase-neon-core']}}),
  makeKcProduct({id:'kc-money-butler',name:'KC Money Butler',repo:'Kasse',kind:'MONEY_BUTLER',notes:'Als eigene KC-Anwendung geführt; Quellbestand liegt derzeit innerhalb der MarktKasse-Suite.'}),
  makeKcProduct({id:'kc-designer',name:'KC Designer',repo:null,kind:'DESIGNER',repositoryState:REPOSITORY_STATE.REPO_NOT_YET_CREATED,notes:'KC-Programm bekannt; GitHub-Repository/Quellort noch zuzuordnen.'}),
  makeKcProduct({id:'kc-backup-solution',name:'KC Backup-Lösung',repo:null,kind:'BACKUP',repositoryState:REPOSITORY_STATE.REPO_NOT_YET_CREATED,notes:'KC-Programm bekannt. Nicht mit der privaten PC Backup Vault/B2-Infrastruktur gleichsetzen, solange die Zuordnung nicht bestätigt ist.',dependencies:{storage:['kc-backup-storage']}}),
  makeKcProduct({id:'kc-communication',name:'KC Communication',repo:'KC-Communication',kind:'COMMUNICATION',critical:true,dependencies:{databases:['db-supabase-core']}}),
  makeKcProduct({id:'kc-communication-public',name:'KC Communication Public',repo:'KC-Communication-Public',kind:'COMMUNICATION_PUBLIC',dependencies:{communication:['kc-communication']}}),
  makeKcProduct({id:'kc-dp2',name:'KC DP2 · neu',repo:'dp3',kind:'DIENSTPLAN',critical:true,dependencies:{databases:['db-supabase-core'],communication:['kc-communication'],failover:['flow-supabase-neon-core']}}),
  makeKcProduct({id:'kc-dp2-legacy',name:'KC DP2 · alt',repo:'Dienstplan',kind:'DIENSTPLAN_LEGACY',notes:'Älterer Dienstplan-Stand; Beziehung zum aktuellen dp3 bleibt versioniert getrennt.',dependencies:{databases:['db-supabase-core']}}),
  makeKcProduct({id:'kc-weihnachten-praesentation',name:'KC Weihnachtsmarkt-Präsentation',repo:null,kind:'PRESENTATION_TV',repositoryState:REPOSITORY_STATE.REPO_NOT_YET_CREATED,notes:'KC-Präsentations-/TV-Anwendung bekannt; Repository oder Quellort noch zuzuordnen.'}),

  // Bereits bekannte weitere KC-Produkte / Infrastrukturprogramme.
  makeKcProduct({id:'kc-bilderrechner',name:'KC Bilderrechner',repo:'KC-Bilderrechner',kind:'BILDER',dependencies:{databases:['db-supabase-core']}}),
  makeKcProduct({id:'kc-futura',name:'KC Futura Academy',repo:'KC-Futura-Academy',kind:'ACADEMY',critical:true,dependencies:{databases:['db-supabase-futura'],communication:['kc-communication']}}),
  makeKcProduct({id:'kc-failover-gateway',name:'KC Failover Gateway',repo:'KC-Failover-Gateway',kind:'FAILOVER',critical:true,dependencies:{databases:['db-supabase-core','db-neon-core-mirror'],failover:['flow-supabase-neon-core']}}),
  makeKcProduct({id:'kc-werbewebsite',name:'KC Werbewebsite',repo:'KC-Werbewebsite',kind:'WEBSITE'}),
  makeKcProduct({id:'kc-kuechen-detektiv',name:'KC Küchen-Detektiv',repo:'KC-Kuechen-Detektiv',kind:'GAME'}),
  makeKcProduct({id:'kicc',name:'KICC',repo:'KC-Infrastructure-Control-Center',kind:'CONTROL_CENTER',dependencies:{databases:['db-supabase-core','db-supabase-futura','db-neon-core-mirror'],communication:['kc-communication'],failover:['flow-supabase-neon-core']}})
];

function cls(s){return({HEALTHY:'healthy',DEGRADED:'degraded',FAILED:'failed',MAINTENANCE:'maintenance'})[s]||'unknown';}
function depText(p){const d=dependencySummary(p);return d.count?`${d.count} Abhängigkeiten`:'keine registrierten Abhängigkeiten';}
function repoText(p){return p.repo?`${p.owner}/${p.repo}`:`kein Repo · ${p.repositoryState}`;}

async function probeRepo(p){
  if(!p.repo){p.repoHealth='NOT_APPLICABLE';p.repoTrust='UNVERIFIED';p.repoMeasuredAt=null;const h=evaluateProductHealth(p);p.status=h.status;p.healthReason=h.reason;return;}
  const measuredAt=new Date().toISOString();
  try{
    const r=await fetch(`https://api.github.com/repos/${p.owner}/${p.repo}`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
    if(r.status===404||r.status===403||r.status===429){Object.assign(p,{repoHealth:'UNKNOWN',repoMeasuredAt:measuredAt,repoTrust:'OBSERVED_ATTEMPT',measuredAt});const h=evaluateProductHealth(p);p.status=h.status;p.healthReason=h.reason;return;}
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const d=await r.json();
    Object.assign(p,{repositoryState:REPOSITORY_STATE.REGISTERED,repoHealth:d.archived?'DEGRADED':'HEALTHY',repoMeasuredAt:measuredAt,repoTrust:'OBSERVED_REMOTE',measuredAt,trust:'OBSERVED_REMOTE',visibility:d.visibility,defaultBranch:d.default_branch,lastActivityAt:d.pushed_at});
    const h=evaluateProductHealth(p);p.status=h.status;p.healthReason=h.reason;
  }catch{Object.assign(p,{repoHealth:'UNKNOWN',repoMeasuredAt:measuredAt,repoTrust:'OBSERVED_ATTEMPT',measuredAt,status:'UNKNOWN'});}
}

function applyRuntimeObservation(productId,observation={}){
  const p=PROGRAMS.find(x=>x.id===productId);if(!p)throw new Error('Unknown KC product');
  const measuredAt=observation.measuredAt||new Date().toISOString();
  const runtimeTrust=observation.trust||'UNVERIFIED';
  const allowed=['deploymentUrl','deploymentHealth','telemetryHealth','version','lastActivityAt'];
  for(const key of allowed)if(Object.prototype.hasOwnProperty.call(observation,key))p[key]=observation[key];
  Object.assign(p,{runtimeMeasuredAt:measuredAt,runtimeTrust,measuredAt,trust:runtimeTrust});
  const h=evaluateProductHealth(p);p.status=h.status;p.healthReason=h.reason;render();return p;
}

function render(){
  const host=document.getElementById('kcProgramCards');if(!host)return;
  host.innerHTML=PROGRAMS.map(p=>{const h=evaluateProductHealth(p),d=dependencySummary(p);return`<article class="db-card"><div class="db-title"><span class="status-chip ${cls(h.status)}"><span class="dot"></span>${h.status}</span><strong>${p.name}</strong></div><div class="db-meta"><span>Typ: ${p.kind}${p.critical?' · kritisch':''}</span><span>Repo: ${repoText(p)}</span><span>Version: ${p.version||'—'}</span><span>Deployment: ${p.deploymentUrl||'noch nicht registriert'}</span><span>Repo: ${p.repoHealth} · Live: ${p.deploymentHealth} · Telemetrie: ${p.telemetryHealth}</span><span>Repo-Messung: ${p.repoMeasuredAt?new Date(p.repoMeasuredAt).toLocaleString('de-DE'):'—'} · Runtime: ${p.runtimeMeasuredAt?new Date(p.runtimeMeasuredAt).toLocaleString('de-DE'):'—'}</span><span>${depText(p)}</span></div><div class="caps"><span class="cap ${d.databases.length?'available':'unknown'}">DB ${d.databases.length}</span><span class="cap ${d.communication.length?'available':'unknown'}">Kommunikation ${d.communication.length}</span><span class="cap ${d.failover.length?'available':'unknown'}">Failover ${d.failover.length}</span><span class="cap ${d.storage.length?'available':'unknown'}">Storage ${d.storage.length}</span></div><div class="db-note">${h.reason}${p.notes?` · ${p.notes}`:''}</div></article>`;}).join('');
}

async function refresh(){await Promise.all(PROGRAMS.map(probeRepo));render();}
window.KICC_PROGRAMS={programs:PROGRAMS,refresh,render,applyRuntimeObservation,impactedBy:resourceId=>impactedProducts(PROGRAMS,resourceId),impact:resourceId=>summarizeImpact(PROGRAMS,resourceId),impactMatrix:()=>buildImpactMatrix(PROGRAMS),summary:()=>PROGRAMS.map(p=>({...p,health:evaluateProductHealth(p),dependencies:dependencySummary(p)}))};
render();refresh();setInterval(refresh,10*60*1000);setInterval(render,30*1000);
