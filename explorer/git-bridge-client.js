import { GIT_BRIDGE_SCHEMA, validateBridgeStatus } from './git-bridge-contract.js';

const TIMEOUT_MS=8000;

function endpoint(){
  const raw=globalThis.KICC_GIT_BRIDGE_ENDPOINT;
  if(!raw)return null;
  try{
    const u=new URL(raw,location.href);
    if(u.protocol!=='https:')return null;
    return u.toString().replace(/\/$/,'');
  }catch{return null;}
}

async function authHeader(){
  if(typeof globalThis.KICC_AUTH?.getGitBridgeAuth!=='function')return null;
  const auth=await globalThis.KICC_AUTH.getGitBridgeAuth();
  if(!auth)return null;
  if(typeof auth==='string')return auth.startsWith('Bearer ')?auth:`Bearer ${auth}`;
  return auth.authorization||auth.Authorization||null;
}

async function request(path,{method='GET',body=null,requireAuth=true}={}){
  const base=endpoint();
  if(!base)throw new Error('Git-Bridge nicht konfiguriert oder nicht HTTPS');
  const authorization=await authHeader();
  if(requireAuth&&!authorization)throw new Error('Git-Bridge Authentifizierung fehlt');
  const headers={Accept:'application/json'};
  if(body!==null)headers['Content-Type']='application/json';
  if(authorization)headers.Authorization=authorization;
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),TIMEOUT_MS);
  try{
    const r=await fetch(`${base}${path}`,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:'no-store',credentials:'omit',signal:ctrl.signal});
    if(r.status===401||r.status===403)throw new Error('Git-Bridge Authentifizierung abgelehnt');
    if(!r.ok)throw new Error(`Git-Bridge HTTP ${r.status}`);
    return await r.json();
  }finally{clearTimeout(timer);}
}

const state={schema:GIT_BRIDGE_SCHEMA,state:'NOT_CONFIGURED',authenticated:false,trust:'UNVERIFIED',measuredAt:null,collectorId:null,capabilities:[],endpoint:null,issues:[]};

async function refreshStatus(){
  const base=endpoint();
  if(!base){Object.assign(state,{state:'NOT_CONFIGURED',authenticated:false,trust:'UNVERIFIED',measuredAt:null,endpoint:null,capabilities:[],issues:['Endpoint fehlt oder ist nicht HTTPS']});return {...state};}
  try{
    const payload=await request('/status');
    const v=validateBridgeStatus(payload);
    Object.assign(state,payload,{state:v.state,endpoint:base,issues:v.issues,capabilities:v.capabilities||[]});
  }catch(err){
    const msg=err?.message||'Git-Bridge nicht erreichbar';
    Object.assign(state,{state:msg.includes('Authentifizierung')?'AUTH_REQUIRED':'OFFLINE',authenticated:false,trust:'OBSERVED_ATTEMPT',measuredAt:new Date().toISOString(),endpoint:base,capabilities:[],issues:[msg]});
  }
  return {...state};
}

function hasCapability(capability){return state.state==='READY'&&state.authenticated===true&&state.capabilities.includes(capability);}

async function browse({owner,repo,path='',ref='main'}={}){
  if(!hasCapability('repository.read'))throw new Error('Bridge hat keine freigegebene repository.read Capability');
  if(!owner||!repo)throw new Error('Repository fehlt');
  const payload=await request('/browse',{method:'POST',body:{owner,repo,path,ref}});
  if(!Array.isArray(payload?.entries))throw new Error('Ungültige Browse-Antwort');
  return payload.entries.map(x=>({name:x.name,path:x.path,type:x.type,size:Number(x.size)||0,sha:x.sha||null,ref:payload.ref||ref}));
}

async function createDownloadTicket({owner,repo,path,ref='main'}={}){
  if(!hasCapability('repository.download'))throw new Error('Bridge hat keine freigegebene repository.download Capability');
  const payload=await request('/download-ticket',{method:'POST',body:{owner,repo,path,ref}});
  if(!payload?.url||!payload?.expiresAt)throw new Error('Ungültiges Download-Ticket');
  const expires=Date.parse(payload.expiresAt);
  if(!Number.isFinite(expires)||expires<=Date.now())throw new Error('Download-Ticket bereits abgelaufen');
  return {url:payload.url,expiresAt:payload.expiresAt,sha:payload.sha||null};
}

async function submitApprovedTransfer(envelope){
  if(!envelope?.actionId||!envelope?.capability||!envelope?.approval||!envelope?.recoveryPoint)throw new Error('Transfer-Envelope nicht vollständig freigegeben');
  if(!hasCapability(envelope.capability))throw new Error(`Bridge Capability fehlt: ${envelope.capability}`);
  return await request('/transfer',{method:'POST',body:envelope});
}

globalThis.KICC_GIT_BRIDGE={state,refreshStatus,hasCapability,browse,createDownloadTicket,submitApprovedTransfer,endpoint};
refreshStatus();
setInterval(refreshStatus,60_000);
