const PROGRAMS=[
  {id:'kc-dp2',name:'KC DP2',repo:'dp3',kind:'DIENSTPLAN'},
  {id:'kc-dienstplan-legacy',name:'KC Dienstplan · Legacy',repo:'Dienstplan',kind:'DIENSTPLAN_LEGACY'},
  {id:'kc-kasse',name:'KC Marktkasse',repo:'Kasse',kind:'KASSE'},
  {id:'kc-bilder',name:'KC Bilderrechner',repo:'KC-Bilderrechner',kind:'BILDER'},
  {id:'kc-futura',name:'KC Futura Academy',repo:'KC-Futura-Academy',kind:'ACADEMY'},
  {id:'kc-communication',name:'KC Communication',repo:'KC-Communication',kind:'COMMUNICATION'},
  {id:'kc-communication-public',name:'KC Communication Public',repo:'KC-Communication-Public',kind:'COMMUNICATION_PUBLIC'},
  {id:'kc-failover-gateway',name:'KC Failover Gateway',repo:'KC-Failover-Gateway',kind:'FAILOVER'},
  {id:'kc-werbewebsite',name:'KC Werbewebsite',repo:'KC-Werbewebsite',kind:'WEBSITE'},
  {id:'kc-kuechen-detektiv',name:'KC Küchen-Detektiv',repo:'KC-Kuechen-Detektiv',kind:'GAME'},
  {id:'kicc',name:'KICC',repo:'KC-Infrastructure-Control-Center',kind:'CONTROL_CENTER'}
].map(x=>({...x,owner:'Sire65',domain:'KC',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED'}));

const MAX_AGE_MS=15*60*1000;
function fresh(x){return x.measuredAt&&Date.now()-new Date(x.measuredAt).getTime()<=MAX_AGE_MS;}
function status(x){return fresh(x)?(x.status||'UNKNOWN'):'UNKNOWN';}
function cls(s){return({HEALTHY:'healthy',DEGRADED:'degraded',FAILED:'failed'})[s]||'unknown';}

async function probe(p){
  try{
    const r=await fetch(`https://api.github.com/repos/${p.owner}/${p.repo}`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
    if(r.status===404||r.status===403||r.status===429){Object.assign(p,{status:'UNKNOWN',measuredAt:new Date().toISOString(),trust:'OBSERVED_ATTEMPT'});return;}
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const d=await r.json();Object.assign(p,{status:d.archived?'DEGRADED':'HEALTHY',measuredAt:new Date().toISOString(),trust:'OBSERVED_REMOTE',visibility:d.visibility,defaultBranch:d.default_branch,pushedAt:d.pushed_at});
  }catch{Object.assign(p,{status:'UNKNOWN',measuredAt:new Date().toISOString(),trust:'OBSERVED_ATTEMPT'});}
}

function render(){
  const host=document.getElementById('kcProgramCards');if(!host)return;
  host.innerHTML=PROGRAMS.map(p=>`<article class="db-card"><div class="db-title"><span class="status-chip ${cls(status(p))}"><span class="dot"></span>${status(p)}</span><strong>${p.name}</strong></div><div class="db-meta"><span>Typ: ${p.kind}</span><span>Repo: ${p.owner}/${p.repo}</span><span>Sichtbarkeit: ${p.visibility||'—'}</span><span>Letzter Push: ${p.pushedAt?new Date(p.pushedAt).toLocaleString('de-DE'):'—'}</span></div><div class="db-note">KC-Programm · getrennt von privater Infrastruktur.</div></article>`).join('');
}

async function refresh(){await Promise.all(PROGRAMS.map(probe));render();}
window.KICC_PROGRAMS={programs:PROGRAMS,refresh,render,summary:()=>PROGRAMS.map(p=>({...p,status:status(p)}))};
render();refresh();setInterval(refresh,10*60*1000);setInterval(render,30*1000);
