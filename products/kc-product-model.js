export const PRODUCT_HEALTH=['UNKNOWN','HEALTHY','DEGRADED','FAILED','MAINTENANCE'];
export const PRODUCT_HEALTH_POLICY=Object.freeze({
  RUNTIME_REQUIRED:'RUNTIME_REQUIRED',
  STATIC_DEPLOYMENT:'STATIC_DEPLOYMENT',
  SOURCE_ONLY:'SOURCE_ONLY'
});

export function makeKcProduct({id,name,repo,kind,owner='Sire65',critical=false,healthPolicy=PRODUCT_HEALTH_POLICY.RUNTIME_REQUIRED,dependencies={}}){
  return {
    id,type:'KC_PRODUCT',domain:'KC',name,repo,owner,kind,critical,healthPolicy,
    status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',
    repoHealth:'UNKNOWN',deploymentHealth:'UNKNOWN',telemetryHealth:'UNKNOWN',
    version:null,deploymentUrl:null,lastActivityAt:null,
    dependencies:{databases:[],communication:[],failover:[],storage:[],...dependencies}
  };
}

function authoritative(product){return ['OBSERVED_REMOTE','OBSERVED_LOCAL'].includes(product.trust);}
function fresh(product,now){
  const measured=Date.parse(product.measuredAt||'');
  return Number.isFinite(measured)&&now-measured<=15*60*1000;
}

export function evaluateProductHealth(product,now=Date.now()){
  if(!fresh(product,now))return{status:'UNKNOWN',reason:'Produktmessung fehlt oder ist veraltet'};
  if(!authoritative(product))return{status:'UNKNOWN',reason:'Messquelle nicht autoritativ'};

  const policy=product.healthPolicy||PRODUCT_HEALTH_POLICY.RUNTIME_REQUIRED;
  const observed=[product.repoHealth,product.deploymentHealth,product.telemetryHealth].filter(x=>x&&x!=='UNKNOWN');
  if(observed.includes('FAILED'))return{status:'FAILED',reason:'Mindestens eine bestätigte Produktkomponente ist ausgefallen'};
  if(observed.includes('DEGRADED'))return{status:'DEGRADED',reason:'Mindestens eine bestätigte Produktkomponente ist eingeschränkt'};

  if(policy===PRODUCT_HEALTH_POLICY.SOURCE_ONLY){
    return product.repoHealth==='HEALTHY'
      ?{status:'HEALTHY',reason:'Source-only Produkt: Repository autoritativ erreichbar'}
      :{status:'UNKNOWN',reason:'Source-only Produkt: Repositoryzustand nicht bestätigt'};
  }

  if(policy===PRODUCT_HEALTH_POLICY.STATIC_DEPLOYMENT){
    if(!product.deploymentUrl)return{status:'UNKNOWN',reason:'Statisches Deployment noch nicht registriert'};
    return product.deploymentHealth==='HEALTHY'
      ?{status:'HEALTHY',reason:'Statisches Deployment autoritativ erreichbar'}
      :{status:'UNKNOWN',reason:'Statisches Deployment noch nicht autoritativ bestätigt'};
  }

  if(!product.deploymentUrl&&product.telemetryHealth==='UNKNOWN')return{status:'UNKNOWN',reason:'Repository erreichbar, aber kein Runtime-/Deployment-Nachweis vorhanden'};
  if(product.deploymentUrl&&product.deploymentHealth==='UNKNOWN'&&product.telemetryHealth==='UNKNOWN')return{status:'UNKNOWN',reason:'Deployment registriert, Live-/Telemetrie-Health noch nicht bestätigt'};
  if(product.deploymentHealth==='HEALTHY'||product.telemetryHealth==='HEALTHY')return{status:'HEALTHY',reason:'Autoritativer Runtime-Nachweis bestätigt den Produktbetrieb'};
  return{status:'UNKNOWN',reason:'Produktzustand noch nicht durch Runtime-Telemetrie bestätigt'};
}

export function dependencySummary(product){
  const d=product.dependencies||{};
  return {
    databases:d.databases||[],communication:d.communication||[],failover:d.failover||[],storage:d.storage||[],
    count:(d.databases||[]).length+(d.communication||[]).length+(d.failover||[]).length+(d.storage||[]).length
  };
}
