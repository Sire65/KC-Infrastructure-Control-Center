export const NON_KC_REPOSITORY_STATE=Object.freeze({
  REPO_NOT_YET_CREATED:'REPO_NOT_YET_CREATED',
  REPO_UNKNOWN:'REPO_UNKNOWN',
  REPO_REGISTERED:'REPO_REGISTERED'
});

function makeMonitoredProgram({id,name,kind,repo=null,owner='Sire65',notes=''}){
  return {
    id,type:'MONITORED_PROGRAM',domain:'NON_KC',name,kind,repo,owner,
    repositoryState:repo?NON_KC_REPOSITORY_STATE.REPO_REGISTERED:NON_KC_REPOSITORY_STATE.REPO_NOT_YET_CREATED,
    status:'UNKNOWN',repoHealth:'UNKNOWN',runtimeHealth:'UNKNOWN',version:null,deploymentUrl:null,
    repoMeasuredAt:null,runtimeMeasuredAt:null,trust:'UNVERIFIED',notes
  };
}

const PROGRAMS=[
  makeMonitoredProgram({id:'nonkc-pflanzen',name:'Pflanzen',kind:'PLANT_MANAGEMENT',notes:'Nicht KC. Nur zur separaten Überwachung in KICC; beeinflusst keinen KC-Gesamtstatus.'}),
  makeMonitoredProgram({id:'nonkc-raumplanung',name:'Raumplanung',kind:'SPACE_PLANNING',notes:'Nicht KC. Nur zur separaten Überwachung in KICC; beeinflusst keinen KC-Gesamtstatus.'})
];

function cls(s){return({HEALTHY:'healthy',ONLINE:'healthy',DEGRADED:'degraded',FAILED:'failed',OFFLINE:'failed'})[s]||'unknown';}
function render(){
  const host=document.getElementById('nonKcProgramCards');if(!host)return;
  host.innerHTML=PROGRAMS.map(p=>`<article class="db-card"><div class="db-title"><span class="status-chip ${cls(p.status)}"><span class="dot"></span>${p.status}</span><strong>${p.name}</strong></div><div class="db-meta"><span>Bereich: WEITERE PROGRAMME · NON_KC</span><span>Typ: ${p.kind}</span><span>Repo: ${p.repo?`${p.owner}/${p.repo}`:`kein Repo · ${p.repositoryState}`}</span><span>Version: ${p.version||'—'}</span><span>Deployment: ${p.deploymentUrl||'noch nicht registriert'}</span><span>Repo: ${p.repoHealth} · Runtime: ${p.runtimeHealth}</span></div><div class="db-note">${p.notes}</div></article>`).join('');
}

function register(program){
  if(!program?.id||!program?.name)throw new Error('id und name erforderlich');
  if(PROGRAMS.some(x=>x.id===program.id))throw new Error('Programm bereits registriert');
  PROGRAMS.push(makeMonitoredProgram(program));render();return PROGRAMS.at(-1);
}

function applyObservation(id,observation={}){
  const p=PROGRAMS.find(x=>x.id===id);if(!p)throw new Error('Unbekanntes NON_KC-Programm');
  const allowed=['repo','owner','repositoryState','repoHealth','runtimeHealth','version','deploymentUrl','repoMeasuredAt','runtimeMeasuredAt','status','trust','notes'];
  for(const key of allowed)if(Object.prototype.hasOwnProperty.call(observation,key))p[key]=observation[key];
  render();return p;
}

globalThis.KICC_NON_KC={programs:PROGRAMS,register,applyObservation,render,summary:()=>PROGRAMS.map(x=>({...x}))};
render();
