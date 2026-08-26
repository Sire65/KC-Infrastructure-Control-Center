import { SECURITY_CONTROLS, createSecurityFlow, evaluateSecurityFlow, securityGapSummary } from './security-model.js';
import { verifyHttpsEndpoint, databaseSecurityEvidence, certificateCapability } from './security-verifier.js';
import { createSecurityAgentTarget, validateSecurityAgentObservation, evaluateAgentTlsObservation, SECURITY_AGENT_INVARIANTS } from './security-agent-contract.js';
import { SECURITY_CODE_EVIDENCE, codeEvidenceSummary } from './code-evidence-registry.js';

const ENDPOINTS={
  supabaseCore:'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kicc-telemetry',
  supabaseFutura:'https://iddudrxuihdodnvejxcp.supabase.co/functions/v1/kicc-telemetry'
};

const AGENT_TARGETS=[
  createSecurityAgentTarget({id:'agent-target-supabase-core',name:'Supabase · KC Core Telemetry',url:ENDPOINTS.supabaseCore,critical:true}),
  createSecurityAgentTarget({id:'agent-target-supabase-futura',name:'Supabase · Future Academy Telemetry',url:ENDPOINTS.supabaseFutura,critical:true})
].map(x=>({...x,status:'UNKNOWN',observation:null}));

const FLOWS=[
  createSecurityFlow({id:'secflow-indexeddb-supabase',source:'IndexedDB · KC-Clients',target:'Supabase · KC Core',dataClass:'KC-Fachdaten',transport:'UNKNOWN',payloadEncryption:'UNKNOWN',auth:'UNKNOWN',keySource:'UNKNOWN',notes:'Soll: verschlüsselter Transport und verschlüsselte Payload; konkrete Laufzeitbeobachtung noch anzubinden.'}),
  createSecurityFlow({id:'secflow-supabase-neon',source:'Supabase · KC Core',target:'Neon · KC Core Mirror',dataClass:'Mirror-/Failover-Daten',transport:'UNKNOWN',payloadEncryption:'UNKNOWN',auth:'UNKNOWN',keySource:'SERVER_SIDE',notes:'Mirror aktiv; Security-Eigenschaften des produktiven Transportwegs noch autoritativ messen.'}),
  createSecurityFlow({id:'secflow-kicc-supabase-core',source:'KICC',target:'Supabase · KC Core Telemetry',dataClass:'Safe Telemetry',transport:'HTTPS',payloadEncryption:'TLS_ONLY',auth:'JWT',keySource:'SERVER_SIDE',trust:'VERIFIED_CONFIG',notes:'HTTPS/JWT im Bridge-Vertrag konfiguriert; automatische HTTPS-/Auth-Prüfung aktiv.'}),
  createSecurityFlow({id:'secflow-kicc-supabase-futura',source:'KICC',target:'Supabase · Future Academy Telemetry',dataClass:'Safe Telemetry',transport:'HTTPS',payloadEncryption:'TLS_ONLY',auth:'JWT',keySource:'SERVER_SIDE',trust:'VERIFIED_CONFIG',notes:'HTTPS/JWT im Bridge-Vertrag konfiguriert; automatische HTTPS-/Auth-Prüfung aktiv.'}),
  createSecurityFlow({id:'secflow-program-communication',source:'KC-Programme',target:'KC Communication',dataClass:'Meldungen/Events',transport:'UNKNOWN',payloadEncryption:'UNKNOWN',auth:'UNKNOWN',keySource:'UNKNOWN',notes:'Provider- und programmübergreifender Kommunikationspfad; Live-Security noch zu inventarisieren.'}),
  createSecurityFlow({id:'secflow-kasse-local-storage',source:'KC Marktkasse',target:'Browser localStorage',dataClass:'Transaktionen / Outbox / ACK / Konflikte',transport:'LOCAL',payloadEncryption:'UNENCRYPTED',auth:'LOCAL_SESSION',keySource:'NONE',trust:'OBSERVED_CODE',notes:'Im aktuellen Resilience-Modul werden produktive Transaktions-/Outbox-Strukturen als JSON in localStorage geschrieben. Security-Baseline kennzeichnet Plaintext-localStorage als Legacy; Migration erst nach Restore/Offline/Rollback-Tests.'}),
  createSecurityFlow({id:'secflow-kasse-failover-gateway',source:'KC Marktkasse',target:'KC Failover Gateway',dataClass:'Transaktionen / Reconcile / Restore',transport:'HTTPS',payloadEncryption:'TLS_ONLY',auth:'UNKNOWN',keySource:'UNKNOWN',trust:'OBSERVED_CODE',notes:'Clientcode nutzt HTTPS und x-kc-client. Gateway-Sicherheitsbaseline verlangt per-device Auth und erklärt Client-Label ausdrücklich nicht zur Authentifizierung. Laufzeitnachweis für Signatur/MAC fehlt noch.'})
];

function cls(status){return({SECURE:'healthy',WARNING:'degraded',INSECURE:'failed'})[status]||'unknown';}
function mark(status){return status==='SECURE'?'✓':status==='INSECURE'?'!':'?';}
function value(v){return v&&v!=='UNKNOWN'?v:'UNKNOWN';}
function age(ts){if(!ts)return'nie verifiziert';const mins=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/60000));return mins<60?`${mins} min`:`${Math.round(mins/60)} h`;}
function control(id){return SECURITY_CONTROLS.find(x=>x.id===id);}
function setControl(id,status,evidence,measuredAt=new Date().toISOString()){const c=control(id);if(c)Object.assign(c,{status,evidence,measuredAt});}

async function authFor(targetId){
  if(typeof globalThis.KICC_AUTH?.getSupabaseBridgeAuth!=='function')return{};
  try{return await globalThis.KICC_AUTH.getSupabaseBridgeAuth(targetId)||{};}catch{return{};}
}

function applyEndpointEvidence(flow,unauthResult,authResult,configuredAuth='JWT'){
  const best=authResult?.ok?authResult:unauthResult;
  flow.transport=best?.transport||flow.transport;
  flow.auth=unauthResult?.authProtected?configuredAuth:'UNKNOWN';
  flow.lastVerifiedAt=best?.measuredAt||new Date().toISOString();
  flow.trust=best?.trust||'OBSERVED_ATTEMPT';
  const access=authResult?.httpStatus===200?'Autorisierter Zugriff erfolgreich':authResult?.evidence||'Kein autorisierter Zugriff bestätigt';
  flow.notes=`${unauthResult?.evidence||'Unauth-Prüfung fehlt'} · ${access}`;
}

function updateDatabaseControls(){
  const dbs=globalThis.KICC?.databases||[];
  const evidence=dbs.filter(x=>x.id==='db-supabase-core'||x.id==='db-supabase-futura').map(databaseSecurityEvidence);
  if(!evidence.length){setControl('sec-rls','UNKNOWN','Noch keine Datenbank-Telemetrie verfügbar');return;}
  if(evidence.some(x=>x.status==='INSECURE'))setControl('sec-rls','INSECURE',evidence.map(x=>x.evidence).join(' · '));
  else if(evidence.every(x=>x.status==='SECURE'))setControl('sec-rls','SECURE',evidence.map(x=>x.evidence).join(' · '));
  else setControl('sec-rls','WARNING',evidence.map(x=>x.evidence).join(' · '));
}

async function verifyAutomatic(){
  const [coreAuth,futuraAuth]=await Promise.all([authFor('db-supabase-core'),authFor('db-supabase-futura')]);
  const [coreUnauth,coreWithAuth,futuraUnauth,futuraWithAuth]=await Promise.all([
    verifyHttpsEndpoint(ENDPOINTS.supabaseCore),
    verifyHttpsEndpoint(ENDPOINTS.supabaseCore,coreAuth),
    verifyHttpsEndpoint(ENDPOINTS.supabaseFutura),
    verifyHttpsEndpoint(ENDPOINTS.supabaseFutura,futuraAuth)
  ]);

  applyEndpointEvidence(FLOWS.find(x=>x.id==='secflow-kicc-supabase-core'),coreUnauth,coreWithAuth);
  applyEndpointEvidence(FLOWS.find(x=>x.id==='secflow-kicc-supabase-futura'),futuraUnauth,futuraWithAuth);

  const tlsResults=[coreUnauth,futuraUnauth];
  if(tlsResults.every(x=>x.ok&&x.transport==='HTTPS'))setControl('sec-transport-tls','SECURE','Beide KICC-Telemetrie-Endpunkte über HTTPS/TLS erreichbar');
  else if(tlsResults.some(x=>x.status==='INSECURE'))setControl('sec-transport-tls','INSECURE',tlsResults.map(x=>x.evidence).join(' · '));
  else setControl('sec-transport-tls','WARNING',tlsResults.map(x=>x.evidence).join(' · '));

  const authEnforced=coreUnauth.authProtected===true&&futuraUnauth.authProtected===true;
  const suppliedAuth=Boolean(coreAuth?.authorization)&&Boolean(futuraAuth?.authorization);
  const authenticatedWorks=!suppliedAuth||(coreWithAuth.httpStatus===200&&futuraWithAuth.httpStatus===200);
  if(authEnforced&&authenticatedWorks)setControl('sec-auth-jwt','SECURE',suppliedAuth?'JWT wird ohne Token erzwungen und autorisierter Zugriff funktioniert':'JWT wird ohne Token auf beiden Endpunkten erzwungen; aktueller Benutzer-Token noch nicht verfügbar');
  else if(!authEnforced)setControl('sec-auth-jwt','INSECURE','Mindestens ein Telemetrie-Endpunkt erzwingt ohne Token kein 401/403');
  else setControl('sec-auth-jwt','WARNING','JWT wird erzwungen, autorisierter Zugriff konnte aber nicht bestätigt werden');

  updateDatabaseControls();
  render();
}

function securityActions(){
  const gaps=securityGapSummary(FLOWS).rows.filter(x=>x.status!=='SECURE').map(x=>({
    severity:x.status==='INSECURE'?'RED':'YELLOW',
    source:'SECURITY_FLOW',
    id:x.flow.id,
    title:`${x.flow.source} → ${x.flow.target}`,
    detail:x.issues.map(i=>i.message).join(' · ')||'Security-Nachweis unvollständig'
  }));
  const agent=AGENT_TARGETS.flatMap(t=>{
    const e=evaluateAgentTlsObservation(t.observation);
    if(e.status==='SECURE')return[];
    return [{severity:e.status==='INSECURE'?'RED':'YELLOW',source:'SECURITY_AGENT',id:t.id,title:t.name,detail:e.issues.join(' · ')}];
  });
  return [...gaps,...agent];
}

function ingestAgentObservation(targetId,payload){
  const target=AGENT_TARGETS.find(x=>x.id===targetId);if(!target)throw new Error('Unknown security agent target');
  const obs=validateSecurityAgentObservation(payload,targetId);
  target.observation=obs;
  target.status=evaluateAgentTlsObservation(obs).status;
  render();return obs;
}

function renderControls(){
  const host=document.getElementById('securityControls');if(!host)return;
  host.innerHTML=SECURITY_CONTROLS.map(c=>`<article class="security-control"><div><strong>${c.name}</strong><small>${c.category}</small></div><span class="status-chip ${cls(c.status==='SECURE'?'SECURE':c.status==='INSECURE'?'INSECURE':'WARNING')}"><span class="dot"></span>${c.status}</span><p>Soll: ${c.expected}</p><p>Nachweis: ${c.evidence||'noch keiner'}</p></article>`).join('');
}

function renderTopology(){
  const host=document.getElementById('securityTopology');if(!host)return;
  host.innerHTML=FLOWS.map(f=>{const e=evaluateSecurityFlow(f);return `<div class="security-flow ${cls(e.status)}"><div class="security-node"><strong>${f.source}</strong></div><div class="security-link"><span>${mark(e.status)}</span><small>Transport: ${value(f.transport)}<br>Payload: ${value(f.payloadEncryption)}<br>Auth: ${value(f.auth)}</small></div><div class="security-node"><strong>${f.target}</strong></div></div>`;}).join('');
}

function renderMatrix(){
  const body=document.getElementById('securityMatrixRows');if(!body)return;
  body.innerHTML=FLOWS.map(f=>{const e=evaluateSecurityFlow(f);return `<tr><td><span class="status-chip ${cls(e.status)}"><span class="dot"></span>${e.status}</span></td><td>${f.source}</td><td>${f.target}</td><td>${f.dataClass}</td><td>${value(f.transport)}</td><td>${value(f.payloadEncryption)}</td><td>${value(f.auth)}</td><td>${value(f.keySource)}</td><td>${age(f.lastVerifiedAt)}</td><td>${e.issues.map(i=>i.message).join('; ')||'Kein Gap erkannt'}</td></tr>`;}).join('');
}

function renderSummary(){
  const host=document.getElementById('securityGapSummary');if(!host)return;
  const s=securityGapSummary(FLOWS),cert=certificateCapability(),actions=securityActions(),code=codeEvidenceSummary();
  const agentHtml=AGENT_TARGETS.map(t=>{const e=evaluateAgentTlsObservation(t.observation);return `<div><strong>${t.name}</strong><span>Agent: ${e.status} · ${e.issues.join(' · ')||'TLS/Zertifikat vollständig verifiziert'}</span></div>`;}).join('');
  host.innerHTML=`<div class="security-kpis"><div><small>Sicher</small><strong>${s.secure}</strong></div><div><small>Warnung</small><strong>${s.warning}</strong></div><div><small>Unsicher</small><strong>${s.insecure}</strong></div><div><small>Handlungsbedarf</small><strong>${actions.length}</strong></div></div><div class="security-action-list"><div><strong>Code-Nachweise</strong><span>${code.total} Belege · ${code.architectureBaselines} Baselines · ${code.codeObservations} Runtime-Codebeobachtung</span></div>${s.rows.filter(x=>x.status!=='SECURE').map(x=>`<div><strong>${x.flow.source} → ${x.flow.target}</strong><span>${x.issues.map(i=>i.message).join(' · ')}</span></div>`).join('')||'<div>Kein Security-Handlungsbedarf.</div>'}<div><strong>Zertifikats-Tiefenprüfung</strong><span>${cert.browserCanReadCertificateMetadata?'verfügbar':'Security-Agent vorbereitet; Ablaufdatum, Issuer, Fingerprint, TLS-Version und Cipher werden erst mit OBSERVED_AGENT grün'}</span></div>${agentHtml}</div>`;
}

function ingest(flowId,observation){
  const flow=FLOWS.find(x=>x.id===flowId);if(!flow)throw new Error('Unknown security flow');
  const allowed=['transport','payloadEncryption','auth','keySource','lastVerifiedAt','trust','notes'];
  for(const k of allowed)if(Object.prototype.hasOwnProperty.call(observation,k))flow[k]=observation[k];
  render();return flow;
}
function render(){renderControls();renderTopology();renderMatrix();renderSummary();}
window.KICC_SECURITY={flows:FLOWS,controls:SECURITY_CONTROLS,codeEvidence:SECURITY_CODE_EVIDENCE,agentTargets:AGENT_TARGETS,agentInvariants:SECURITY_AGENT_INVARIANTS,ingest,ingestAgentObservation,verifyAutomatic,actions:securityActions,summary:()=>securityGapSummary(FLOWS),render,certificateCapability};
render();verifyAutomatic();setInterval(verifyAutomatic,5*60*1000);setInterval(()=>{updateDatabaseControls();render();},30000);
