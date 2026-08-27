const MAX_VERSION_BYTES=4096;

function githubApi(owner,repo,path=''){
  const base=`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  return path?`${base}/${path}`:base;
}
function pagesUrl(owner,repo){return `https://${String(owner).toLowerCase()}.github.io/${encodeURIComponent(repo)}/`;}
async function fetchJson(url){
  const r=await fetch(url,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
  if(!r.ok)return{ok:false,status:r.status,data:null};
  return{ok:true,status:r.status,data:await r.json()};
}
async function probeVersion(owner,repo,branch){
  const candidates=['VERSION','version.txt','package.json','releases/latest.json'];
  for(const path of candidates){
    try{
      const r=await fetch(githubApi(owner,repo,`contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`),{headers:{Accept:'application/vnd.github.raw+json'},cache:'no-store'});
      if(!r.ok)continue;
      const text=(await r.text()).slice(0,MAX_VERSION_BYTES).trim();
      if(path==='package.json'||path==='releases/latest.json'){
        try{const p=JSON.parse(text);const v=p?.version||p?.tag||p?.releaseVersion;if(v)return{version:String(v),source:path};}catch{}
      }else if(text)return{version:text.split(/\r?\n/)[0].trim(),source:path};
    }catch{}
  }
  return{version:null,source:null};
}
async function probeDeployment(url){
  if(!url)return{health:'UNKNOWN',measuredAt:null,httpStatus:null,latencyMs:null,detail:'Kein Deployment registriert'};
  const started=performance?.now?.()??Date.now();
  try{
    const r=await fetch(url,{method:'GET',cache:'no-store',redirect:'follow'});
    const latencyMs=Math.round((performance?.now?.()??Date.now())-started);
    if(r.ok)return{health:'HEALTHY',measuredAt:new Date().toISOString(),httpStatus:r.status,latencyMs,detail:'Deployment erreichbar'};
    return{health:r.status>=500?'FAILED':'DEGRADED',measuredAt:new Date().toISOString(),httpStatus:r.status,latencyMs,detail:`Deployment HTTP ${r.status}`};
  }catch(error){
    return{health:'UNKNOWN',measuredAt:new Date().toISOString(),httpStatus:null,latencyMs:null,detail:error?.message||'Deployment-Prüfung nicht möglich'};
  }
}

export async function probeGithubProduct(product){
  const measuredAt=new Date().toISOString();
  if(!product?.owner||!product?.repo)return{repoHealth:'NOT_APPLICABLE',repoTrust:'UNVERIFIED',repoMeasuredAt:null};
  const meta=await fetchJson(githubApi(product.owner,product.repo));
  if(!meta.ok){
    if([403,404,429].includes(meta.status))return{repoHealth:'UNKNOWN',repoTrust:'OBSERVED_ATTEMPT',repoMeasuredAt:measuredAt,repoHttpStatus:meta.status};
    return{repoHealth:'DEGRADED',repoTrust:'OBSERVED_ATTEMPT',repoMeasuredAt:measuredAt,repoHttpStatus:meta.status};
  }
  const d=meta.data;
  const branch=d.default_branch||'main';
  const version=await probeVersion(product.owner,product.repo,branch);
  const deploymentUrl=d.homepage&&/^https:\/\//i.test(d.homepage)?d.homepage:(d.has_pages?pagesUrl(product.owner,product.repo):null);
  const deployment=await probeDeployment(deploymentUrl);
  return{
    repoHealth:d.archived?'DEGRADED':'HEALTHY',repoTrust:'OBSERVED_REMOTE',repoMeasuredAt:measuredAt,repoHttpStatus:200,
    repositoryState:'REGISTERED',visibility:d.visibility||'unknown',defaultBranch:branch,lastActivityAt:d.pushed_at||null,repoSizeKb:Number.isFinite(d.size)?d.size:null,
    gitVersion:version.version,versionSource:version.source,hasPages:Boolean(d.has_pages),deploymentUrl,
    deploymentHealth:deployment.health,deploymentMeasuredAt:deployment.measuredAt,deploymentHttpStatus:deployment.httpStatus,deploymentLatencyMs:deployment.latencyMs,deploymentDetail:deployment.detail
  };
}

globalThis.KICC_GITHUB_TELEMETRY={probeGithubProduct};
