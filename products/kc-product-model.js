export const PRODUCT_HEALTH=['UNKNOWN','HEALTHY','DEGRADED','FAILED','MAINTENANCE'];

export function makeKcProduct({id,name,repo,kind,owner='Sire65',critical=false,dependencies={}}){
  return {
    id,type:'KC_PRODUCT',domain:'KC',name,repo,owner,kind,critical,
    status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',
    repoHealth:'UNKNOWN',deploymentHealth:'UNKNOWN',telemetryHealth:'UNKNOWN',
    version:null,deploymentUrl:null,lastActivityAt:null,
    dependencies:{databases:[],communication:[],failover:[],storage:[],...dependencies}
  };
}

export function evaluateProductHealth(product,now=Date.now()){
  const age=product.measuredAt?now-new Date(product.measuredAt).getTime():Infinity;
  if(age>15*60*1000)return{status:'UNKNOWN',reason:'Produktmessung fehlt oder ist veraltet'};
  if(!['OBSERVED_REMOTE','OBSERVED_LOCAL'].includes(product.trust))return{status:'UNKNOWN',reason:'Messquelle nicht autoritativ'};
  const states=[product.repoHealth,product.deploymentHealth,product.telemetryHealth].filter(x=>x&&x!=='UNKNOWN');
  if(states.includes('FAILED'))return{status:'FAILED',reason:'Mindestens eine bestätigte Produktkomponente ist ausgefallen'};
  if(states.includes('DEGRADED'))return{status:'DEGRADED',reason:'Mindestens eine bestätigte Produktkomponente ist eingeschränkt'};
  if(product.deploymentUrl&&product.deploymentHealth==='UNKNOWN')return{status:'UNKNOWN',reason:'Deployment vorhanden, Live-Health noch nicht bestätigt'};
  if(product.repoHealth==='HEALTHY'&&(!product.deploymentUrl||product.deploymentHealth==='HEALTHY'))return{status:'HEALTHY',reason:'Bestätigte Produktkomponenten betriebsbereit'};
  return{status:'UNKNOWN',reason:'Produktzustand noch nicht vollständig bestätigt'};
}

export function dependencySummary(product){
  const d=product.dependencies||{};
  return {
    databases:d.databases||[],communication:d.communication||[],failover:d.failover||[],storage:d.storage||[],
    count:(d.databases||[]).length+(d.communication||[]).length+(d.failover||[]).length+(d.storage||[]).length
  };
}
