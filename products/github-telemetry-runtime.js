import { probeGithubProduct } from '../adapters/github-deployment-telemetry.js';

const STATIC_DEPLOYMENT_KINDS=new Set(['WEBSITE','GAME','COMMUNICATION_PUBLIC']);
const REFRESH_MS=10*60*1000;
let running=false;

function isAuthoritativeRuntime(obs){return ['OBSERVED','OBSERVED_LOCAL','OBSERVED_REMOTE'].includes(obs?.trust);}
function browserRuntime(){return globalThis.KICC?.kcResources?.().find?.(x=>x.id==='runtime-kicc-browser')||null;}
function applyKiccRuntime(program){
  const runtime=browserRuntime();
  if(!runtime?.measuredAt||!isAuthoritativeRuntime(runtime))return;
  globalThis.KICC_PROGRAMS?.applyRuntimeObservation?.(program.id,{
    measuredAt:runtime.measuredAt,
    trust:'OBSERVED_LOCAL',
    deploymentUrl:location.href,
    deploymentHealth:runtime.status==='HEALTHY'?'HEALTHY':runtime.status||'UNKNOWN',
    telemetryHealth:runtime.status==='HEALTHY'?'HEALTHY':runtime.status||'UNKNOWN',
    version:globalThis.KICC?.version||program.version||null
  });
}
function applyStaticRuntime(program,result){
  if(!STATIC_DEPLOYMENT_KINDS.has(program.kind)||!result.deploymentMeasuredAt)return;
  program.healthPolicy='STATIC_DEPLOYMENT';
  globalThis.KICC_PROGRAMS?.applyRuntimeObservation?.(program.id,{
    measuredAt:result.deploymentMeasuredAt,
    trust:result.deploymentHealth==='UNKNOWN'?'UNVERIFIED':'OBSERVED_REMOTE',
    deploymentUrl:result.deploymentUrl,
    deploymentHealth:result.deploymentHealth,
    version:result.version||program.version||null,
    lastActivityAt:result.lastActivityAt||program.lastActivityAt||null
  });
}

async function probeOne(program){
  if(!program?.repo)return;
  try{
    const result=await probeGithubProduct(program);
    Object.assign(program,result,{measuredAt:result.repoMeasuredAt||program.measuredAt});
    if(program.id==='kicc')applyKiccRuntime(program);else applyStaticRuntime(program,result);
  }catch(error){
    program.repoHealth='UNKNOWN';
    program.repoTrust='OBSERVED_ATTEMPT';
    program.repoMeasuredAt=new Date().toISOString();
    program.githubTelemetryError=error?.message||String(error);
  }
}

export async function refreshGithubTelemetry(){
  if(running)return;
  const api=globalThis.KICC_PROGRAMS;
  if(!api?.programs)return;
  running=true;
  try{
    await Promise.all(api.programs.map(probeOne));
    api.render?.();
    globalThis.KICC_DASHBOARD_INSTRUMENTS?.render?.();
    globalThis.dispatchEvent(new CustomEvent('kicc:github-telemetry',{detail:{measuredAt:new Date().toISOString()}}));
  }finally{running=false;}
}

function start(){
  const wait=()=>{
    if(globalThis.KICC_PROGRAMS?.programs){refreshGithubTelemetry();setInterval(refreshGithubTelemetry,REFRESH_MS);}
    else setTimeout(wait,250);
  };
  wait();
}

start();
globalThis.KICC_GITHUB_RUNTIME={refresh:refreshGithubTelemetry};
