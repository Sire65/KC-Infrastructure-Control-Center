import { SECURITY_CONTROLS, createSecurityFlow, evaluateSecurityFlow, securityGapSummary } from './security-model.js';
import { verifyHttpsEndpoint, databaseSecurityEvidence, certificateCapability } from './security-verifier.js';

const ENDPOINTS={
  supabaseCore:'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kicc-telemetry',
  supabaseFutura:'https://iddudrxuihdodnvejxcp.supabase.co/functions/v1/kicc-telemetry'
};

const FLOWS=[
  createSecurityFlow({id:'secflow-indexeddb-supabase',source:'IndexedDB · KC-Clients',target:'Supabase · KC Core',dataClass:'KC-Fachdaten',transport:'UNKNOWN',payloadEncryption:'UNKNOWN',auth:'UNKNOWN',keySource:'UNKNOWN',notes:'Soll: verschlüsselter Transport und verschlüsselte Payload; konkrete Laufzeitbeobachtung noch anzubinden.'}),
  createSecurityFlow({id:'secflow-supabase-neon',source:'Supabase · KC Core',target:'Neon · KC Core Mirror',dataClass:'Mirror-/Failover-Daten',transport:'UNKNOWN',payloadEncryption:'UNKNOWN',auth:'UNKNOWN',keySource:'SERVER_SIDE',notes:'Mirror aktiv; Security-Eigenschaften des produktiven Transportwegs noch autoritativ messen.'}),
  createSecurityFlow({id:'secflow-kicc-supabase-core',source:'KICC',target:'Supabase · KC Core Telemetry',dataClass:'Safe Telemetry',transport:'HTTPS',payloadEncryption:'TLS_ONLY',auth:'JWT',keySource:'SERVER_SIDE',trust:'VERIFIED_CONFIG',notes:'HTTPS/JWT im Bridge-Vertrag konfiguriert; automatische HTTPS-/Auth-Prüfung aktiv.'}),
  createSecurityFlow({id:'secflow-kicc-supabase-futura',source:'KICC',target:'Supabase · Future Academy Telemetry',dataClass:'Safe Telemetry',transport:'HTTPS',payloadEncryption:'TLS_ONLY',auth:'JWT',keySource:'SERVER_SIDE',trust:'VERIFIED_CONFIG',notes:'HTTPS/JWT im Bridge-Vertrag konfiguriert; automatische HTTPS-/Auth-Prüfung aktiv.'}),
  createSecurityFlow({id:'secflow-program-communication',source:'KC-Programme',target:'KC Communication',dataClass:'Meldungen/Events',transport:'UNKNOWN',payloadEncryption:'UNKNOWN',auth:'UNKNOWN',keySource:'UNKNOWN',notes:'Provider- und programmübergreifender Kommunikationspfad; Live-Security noch zu inventarisieren.'}),
  createSecurityFlow({id:'secflow-kasse-manager',source:'KC Marktkasse',target:'PC Manager / KC Core',dataClass:'Verkauf/Stammdaten/Status',transport:'UNKNOWN',payloadEncryption:'UNKNOWN',auth:'UNKNOWN',keySource:'UNKNOWN',notes:'Offline/Netzwerkpfade getrennt messen; keine Annahme über Verschlüsselung.'})
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

function applyEndpointEvidence(flow,result,configuredAuth='JWT'){
  flow.transport=result.transport||flow.transport;
  flow.auth=result.authProtected?configuredAuth:flow.auth;
  flow.lastVerifiedAt=result.measuredAt||new Date().toISOString();
  flow.trust=result.trust||'OBSERVED_ATTEMPT';
  flow.notes=result.evidence||flow.notes;
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
  const coreAuth=await authFor('db-supabase-core');
  const futuraAuth=await authFor('db-supabase-futura');
  const [core,futura]=await Promise.all([
    verifyHttpsEndpoint(ENDPOINTS.supabaseCore,coreAuth),
    verifyHttpsEndpoint(ENDPOINTS.supabaseFutura,futuraAuth)
  ]);
  applyEndpointEvidence(FLOWS.find(x=>x.id==='secflow-kicc-supabase-core'),core);
  applyEndpointEvidence(FLOWS.find(x=>x.id==='secflow-kicc-supabase-futura'),futura);

  const results=[core,futura];
  if(results.every(x=>x.ok&&x.transport==='HTTPS'))setControl('sec-transport-tls','SECURE','KICC-Telemetrie-Endpunkte über HTTPS/TLS erreichbar');
  else if(results.some(x=>x.status==='INSECURE'))setControl('sec-transport-tls','INSECURE',results.map(x=>x.evidence).join(' · '));
  else setControl('sec-transport-tls','WARNING',results.map(x=>x.evidence).join(' · '));

  if(results.every(x=>x.authProtected||x.httpStatus===200))setControl('sec-auth-jwt','SECURE','Telemetry-Endpunkte reagieren geschützt bzw. mit gültiger Authentifizierung');
  else setControl('sec-auth-jwt','WARNING','Authentifizierung noch nicht auf allen Telemetrie-Endpunkten bestätigt');

  updateDatabaseControls();
  render();
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
  const s=securityGapSummary(FLOWS),cert=certificateCapability();
  host.innerHTML=`<div class="security-kpis"><div><small>Sicher</small><strong>${s.secure}</strong></div><div><small>Warnung</small><strong>${s.warning}</strong></div><div><small>Unsicher</small><strong>${s.insecure}</strong></div><div><small>Mit UNKNOWN</small><strong>${s.unknown}</strong></div></div><div class="security-action-list">${s.rows.filter(x=>x.status!=='SECURE').map(x=>`<div><strong>${x.flow.source} → ${x.flow.target}</strong><span>${x.issues.map(i=>i.message).join(' · ')}</span></div>`).join('')||'<div>Kein Security-Handlungsbedarf.</div>'}<div><strong>Zertifikats-Tiefenprüfung</strong><span>${cert.browserCanReadCertificateMetadata?'verfügbar':'Windows-Agent/Server-Prüfung erforderlich für Ablaufdatum, Issuer, Fingerprint, TLS-Version und Cipher'}</span></div></div>`;
}

function ingest(flowId,observation){
  const flow=FLOWS.find(x=>x.id===flowId);if(!flow)throw new Error('Unknown security flow');
  const allowed=['transport','payloadEncryption','auth','keySource','lastVerifiedAt','trust','notes'];
  for(const k of allowed)if(Object.prototype.hasOwnProperty.call(observation,k))flow[k]=observation[k];
  render();return flow;
}
function render(){renderControls();renderTopology();renderMatrix();renderSummary();}
window.KICC_SECURITY={flows:FLOWS,controls:SECURITY_CONTROLS,ingest,verifyAutomatic,summary:()=>securityGapSummary(FLOWS),render,certificateCapability};
render();verifyAutomatic();setInterval(verifyAutomatic,5*60*1000);setInterval(()=>{updateDatabaseControls();render();},30000);
