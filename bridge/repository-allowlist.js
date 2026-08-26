export const REPOSITORY_DOMAINS=Object.freeze(['KC','NON_KC','PRIVATE']);

export function makeRepositoryPolicy({owner,repo,domain='KC',read=true,download=true,write=false,branches=['main'],paths=['/**']}={}){
  if(!owner||!repo)throw new Error('owner und repo erforderlich');
  if(!REPOSITORY_DOMAINS.includes(domain))throw new Error('Ungültige Domain');
  return {owner,repo,domain,read:Boolean(read),download:Boolean(download),write:Boolean(write),branches:[...branches],paths:[...paths]};
}

export function repositoryKey(owner,repo){return `${owner}/${repo}`.toLowerCase();}

export function evaluateRepositoryAccess(policies=[],request={}){
  const key=repositoryKey(request.owner,request.repo);
  const policy=policies.find(p=>repositoryKey(p.owner,p.repo)===key);
  if(!policy)return{allowed:false,reason:'REPOSITORY_NOT_ALLOWLISTED'};
  const capability=String(request.capability||'');
  const ref=request.ref||'main';
  if(!policy.branches.includes('*')&&!policy.branches.includes(ref))return{allowed:false,reason:'BRANCH_NOT_ALLOWED',policy};
  if(capability==='repository.read'&&!policy.read)return{allowed:false,reason:'READ_NOT_ALLOWED',policy};
  if(capability==='repository.download'&&!policy.download)return{allowed:false,reason:'DOWNLOAD_NOT_ALLOWED',policy};
  if(!['repository.read','repository.download'].includes(capability)&&!policy.write)return{allowed:false,reason:'WRITE_NOT_ALLOWED',policy};
  return{allowed:true,reason:'ALLOWLIST_OK',policy};
}

export const DEFAULT_REPOSITORY_POLICY_MODE='DENY_BY_DEFAULT';
