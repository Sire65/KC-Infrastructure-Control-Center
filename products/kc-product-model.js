export const PRODUCT_HEALTH=['UNKNOWN','HEALTHY','DEGRADED','FAILED','MAINTENANCE'];
export const PRODUCT_HEALTH_POLICY=Object.freeze({
  RUNTIME_REQUIRED:'RUNTIME_REQUIRED',
  STATIC_DEPLOYMENT:'STATIC_DEPLOYMENT',
  SOURCE_ONLY:'SOURCE_ONLY'
});
export const REPOSITORY_STATE=Object.freeze({
  REGISTERED:'REGISTERED',
  LOCAL_ONLY:'LOCAL_ONLY',
  REPO_NOT_YET_CREATED:'REPO_NOT_YET_CREATED',
  DISCOVERED:'DISCOVERED',
  UNKNOWN:'UNKNOWN'
});

export function makeKcProduct({id,name,repo=null,kind,owner='Sire65',critical=false,healthPolicy=PRODUCT_HEALTH_POLICY.RUNTIME_REQUIRED,repositoryState=null,notes=null,dependencies={}}){
  const resolvedRepoState=repositoryState|| (repo?REPOSITORY_STATE.REGISTERED:REPOSITORY_STATE.REPO_NOT_YET_CREATED);
  return {
    id,type:'KC_PRODUCT',domain:'KC',name,repo,owner,kind,critical,healthPolicy,repositoryState:resolvedRepoState,notes,
    status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',
    repoHealth:repo?'UNKNOWN':'NOT_APPLICABLE',repoMeasuredAt:null,repoTrust:'UNVERIFIED',
    deploymentHealth:'UNKNOWN',telemetryHealth:'UNKNOWN',runtimeMeasuredAt:null,runtimeTrust:'UNVERIFIED',
    version:null,deploymentUrl:null,lastActivityAt:null,
    dependencies:{databases:[],communication:[],failover:[],storage:[],...dependencies}
  };
}

function isAuthoritative(trust){return ['OBSERVED_REMOTE','OBSERVED_LOCAL'].includes(trust);}
function isFresh(ts,now,maxAgeMs=15*60*1000){
  const measured=Date.parse(ts||'');
  return Number.isFinite(measured)&&now-measured<=maxAgeMs;
}

export function evaluateProductHealth(product,now=Date.now()){
  const policy=product.healthPolicy||PRODUCT_HEALTH_POLICY.RUNTIME_REQUIRED;

  if(policy===PRODUCT_HEALTH_POLICY.SOURCE_ONLY){
    if(!product.repo)return{status:'UNKNOWN',reason:'Source-only Produkt hat noch kein Repository'};
    if(!isFresh(product.repoMeasuredAt,now))return{status:'UNKNOWN',reason:'Repositorymessung fehlt oder ist veraltet'};
    if(!isAuthoritative(product.repoTrust))return{status:'UNKNOWN',reason:'Repositorymessung nicht autoritativ'};
    if(product.repoHealth==='FAILED')return{status:'FAILED',reason:'Repository autoritativ als ausgefallen bestätigt'};
    if(product.repoHealth==='DEGRADED')return{status:'DEGRADED',reason:'Repository autoritativ eingeschränkt'};
    return product.repoHealth==='HEALTHY'
      ?{status:'HEALTHY',reason:'Source-only Produkt: Repository autoritativ erreichbar'}
      :{status:'UNKNOWN',reason:'Source-only Produkt: Repositoryzustand nicht bestätigt'};
  }

  if(!isFresh(product.runtimeMeasuredAt,now))return{status:'UNKNOWN',reason:'Runtime-Messung fehlt oder ist veraltet'};
  if(!isAuthoritative(product.runtimeTrust))return{status:'UNKNOWN',reason:'Runtime-Messquelle nicht autoritativ'};

  const runtimeStates=[product.deploymentHealth,product.telemetryHealth].filter(x=>x&&x!=='UNKNOWN');
  if(runtimeStates.includes('FAILED'))return{status:'FAILED',reason:'Mindestens eine bestätigte Runtime-Komponente ist ausgefallen'};
  if(runtimeStates.includes('DEGRADED'))return{status:'DEGRADED',reason:'Mindestens eine bestätigte Runtime-Komponente ist eingeschränkt'};

  if(policy===PRODUCT_HEALTH_POLICY.STATIC_DEPLOYMENT){
    if(!product.deploymentUrl)return{status:'UNKNOWN',reason:'Statisches Deployment noch nicht registriert'};
    return product.deploymentHealth==='HEALTHY'
      ?{status:'HEALTHY',reason:'Statisches Deployment autoritativ erreichbar'}
      :{status:'UNKNOWN',reason:'Statisches Deployment noch nicht autoritativ bestätigt'};
  }

  if(!product.deploymentUrl&&product.telemetryHealth==='UNKNOWN')return{status:'UNKNOWN',reason:'Runtime-Nachweis fehlt; Repository ist für Produkt-Health nicht ausreichend'};
  if(product.deploymentUrl&&product.deploymentHealth==='UNKNOWN'&&product.telemetryHealth==='UNKNOWN')return{status:'UNKNOWN',reason:'Deployment registriert, Live-/Telemetrie-Health noch nicht bestätigt'};
  if(product.deploymentHealth==='HEALTHY'||product.telemetryHealth==='HEALTHY')return{status:'HEALTHY',reason:'Frischer autoritativer Runtime-Nachweis bestätigt den Produktbetrieb'};
  return{status:'UNKNOWN',reason:'Produktzustand noch nicht durch Runtime-Telemetrie bestätigt'};
}

export function dependencySummary(product){
  const d=product.dependencies||{};
  return {
    databases:d.databases||[],communication:d.communication||[],failover:d.failover||[],storage:d.storage||[],
    count:(d.databases||[]).length+(d.communication||[]).length+(d.failover||[]).length+(d.storage||[]).length
  };
}
