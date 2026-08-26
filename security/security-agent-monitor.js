import { validateSecurityAgentObservation, evaluateAgentTlsObservation } from './security-agent-contract.js';

const STATE={status:'PREPARED',measuredAt:null,trust:'UNVERIFIED',message:'Security-Agent vorbereitet, aber noch nicht verbunden.',agentId:null,lastAttemptAt:null};
const POLL_MS=5*60*1000;

function endpoint(){return globalThis.KICC_SECURITY_AGENT_ENDPOINT||null;}
function cls(s){return({ONLINE:'healthy',HEALTHY:'healthy',DEGRADED:'degraded',FAILED:'failed',OFFLINE:'failed',AUTH_REQUIRED:'degraded',PREPARED:'unknown'})[s]||'unknown';}
function age(ts){if(!ts)return'—';const sec=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000));return sec<60?`${sec}s`:`${Math.round(sec/60)}min`;}

async function auth(){
  if(typeof globalThis.KICC_AUTH?.getSecurityAgentAuth!=='function')return null;
  try{return await globalThis.KICC_AUTH.getSecurityAgentAuth();}catch{return null;}
}

function targets(){return globalThis.KICC_SECURITY?.agentTargets||[];}

function render(){
  const host=document.getElementById('securityAgentCards');if(!host)return;
  const rows=targets();
  const targetHtml=rows.map(t=>{
    const e=evaluateAgentTlsObservation(t.observation);
    const cert=t.observation?.certificate||{};
    return `<article class="security-control"><div><strong>${t.name}</strong><small>${t.critical?'KRITISCH':'STANDARD'} · ${t.domain}</small></div><span class="status-chip ${cls(e.status==='SECURE'?'ONLINE':e.status==='INSECURE'?'FAILED':'PREPARED')}"><span class="dot"></span>${e.status}</span><p>TLS: ${t.observation?.tlsVersion||'—'} · Cipher: ${t.observation?.cipher||'—'}</p><p>Zertifikat bis: ${cert.validTo?new Date(cert.validTo).toLocaleString('de-DE'):'—'} · Issuer: ${cert.issuer||'—'}</p><p>${e.issues.join(' · ')||'TLS/Zertifikat vollständig verifiziert.'}</p></article>`;
  }).join('');
  host.innerHTML=`<article class="security-agent-overview"><div><strong>KC Security-Agent</strong><small>read-only · Zertifikate / TLS / DNS / Erreichbarkeit</small></div><span class="status-chip ${cls(STATE.status)}"><span class="dot"></span>${STATE.status}</span><p>${STATE.message}</p><p>Endpoint: ${endpoint()?'konfiguriert':'noch nicht konfiguriert'} · letzte Messung: ${age(STATE.measuredAt)} · Targets: ${rows.length}</p></article>${targetHtml}`;
}

async function refresh(){
  const ep=endpoint();STATE.lastAttemptAt=new Date().toISOString();
  if(!ep){Object.assign(STATE,{status:'PREPARED',trust:'UNVERIFIED',message:'Security-Agent vorbereitet, aber noch nicht verbunden.'});render();return STATE;}
  let url;
  try{url=new URL(ep);if(url.protocol!=='https:')throw new Error('Security-Agent endpoint must use HTTPS');}
  catch(e){Object.assign(STATE,{status:'FAILED',trust:'OBSERVED_ATTEMPT',message:e instanceof Error?e.message:String(e)});render();return STATE;}
  const a=await auth();
  if(!a?.authorization){Object.assign(STATE,{status:'AUTH_REQUIRED',trust:'AUTH_REQUIRED',message:'Agent-Endpoint konfiguriert; sichere Anmeldung fehlt.'});render();return STATE;}
  try{
    const r=await fetch(url.toString(),{method:'GET',headers:{accept:'application/json',authorization:a.authorization},cache:'no-store',credentials:'omit'});
    if(r.status===401||r.status===403){Object.assign(STATE,{status:'AUTH_REQUIRED',measuredAt:new Date().toISOString(),trust:'AUTH_REQUIRED',message:'Security-Agent verlangt gültige Anmeldung.'});render();return STATE;}
    if(!r.ok)throw new Error(`Security-Agent HTTP ${r.status}`);
    const payload=await r.json();
    if(!payload||payload.schemaVersion!=='1.0'||payload.trust!=='OBSERVED_AGENT'||!Array.isArray(payload.observations))throw new Error('Ungültige Security-Agent-Antwort');
    let accepted=0,failed=0;
    for(const row of payload.observations){
      const target=targets().find(t=>t.id===row.targetId);if(!target)continue;
      try{const obs=validateSecurityAgentObservation({...row,schemaVersion:payload.schemaVersion,trust:payload.trust},target.id);globalThis.KICC_SECURITY.ingestAgentObservation(target.id,{...row,schemaVersion:payload.schemaVersion,trust:payload.trust});accepted++;}
      catch{failed++;}
    }
    Object.assign(STATE,{status:failed?'DEGRADED':'ONLINE',agentId:payload.agentId||null,measuredAt:payload.measuredAt||new Date().toISOString(),trust:'OBSERVED_AGENT',message:failed?`${accepted} Agent-Messungen akzeptiert, ${failed} verworfen.`:`${accepted} Agent-Messungen autoritativ übernommen.`});
  }catch(e){Object.assign(STATE,{status:'DEGRADED',measuredAt:new Date().toISOString(),trust:'OBSERVED_ATTEMPT',message:e instanceof Error?e.message:String(e)});}
  render();return STATE;
}

window.KICC_SECURITY_AGENT={state:STATE,refresh,render,targets};
render();refresh();setInterval(refresh,POLL_MS);setInterval(render,30000);
