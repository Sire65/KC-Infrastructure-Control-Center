import { SECURITY_CONTROLS, createSecurityFlow, evaluateSecurityFlow, securityGapSummary } from './security-model.js';

const FLOWS=[
  createSecurityFlow({id:'secflow-indexeddb-supabase',source:'IndexedDB · KC-Clients',target:'Supabase · KC Core',dataClass:'KC-Fachdaten',transport:'UNKNOWN',payloadEncryption:'UNKNOWN',auth:'UNKNOWN',keySource:'UNKNOWN',notes:'Soll: verschlüsselter Transport und verschlüsselte Payload; konkrete Laufzeitbeobachtung noch anzubinden.'}),
  createSecurityFlow({id:'secflow-supabase-neon',source:'Supabase · KC Core',target:'Neon · KC Core Mirror',dataClass:'Mirror-/Failover-Daten',transport:'UNKNOWN',payloadEncryption:'UNKNOWN',auth:'UNKNOWN',keySource:'SERVER_SIDE',notes:'Mirror aktiv; Security-Eigenschaften des produktiven Transportwegs noch autoritativ messen.'}),
  createSecurityFlow({id:'secflow-kicc-supabase-core',source:'KICC',target:'Supabase · KC Core Telemetry',dataClass:'Safe Telemetry',transport:'HTTPS',payloadEncryption:'TLS_ONLY',auth:'JWT',keySource:'SERVER_SIDE',trust:'VERIFIED_CONFIG',notes:'HTTPS/JWT im Bridge-Vertrag konfiguriert; Live-Auth/Handshake-Verifikation folgt.'}),
  createSecurityFlow({id:'secflow-kicc-supabase-futura',source:'KICC',target:'Supabase · Future Academy Telemetry',dataClass:'Safe Telemetry',transport:'HTTPS',payloadEncryption:'TLS_ONLY',auth:'JWT',keySource:'SERVER_SIDE',trust:'VERIFIED_CONFIG',notes:'HTTPS/JWT im Bridge-Vertrag konfiguriert; Live-Auth/Handshake-Verifikation folgt.'}),
  createSecurityFlow({id:'secflow-program-communication',source:'KC-Programme',target:'KC Communication',dataClass:'Meldungen/Events',transport:'UNKNOWN',payloadEncryption:'UNKNOWN',auth:'UNKNOWN',keySource:'UNKNOWN',notes:'Provider- und programmübergreifender Kommunikationspfad; Live-Security noch zu inventarisieren.'}),
  createSecurityFlow({id:'secflow-kasse-manager',source:'KC Marktkasse',target:'PC Manager / KC Core',dataClass:'Verkauf/Stammdaten/Status',transport:'UNKNOWN',payloadEncryption:'UNKNOWN',auth:'UNKNOWN',keySource:'UNKNOWN',notes:'Offline/Netzwerkpfade getrennt messen; keine Annahme über Verschlüsselung.'})
];

function cls(status){return({SECURE:'healthy',WARNING:'degraded',INSECURE:'failed'})[status]||'unknown';}
function mark(status){return status==='SECURE'?'✓':status==='INSECURE'?'!':'?';}
function value(v){return v&&v!=='UNKNOWN'?v:'UNKNOWN';}
function age(ts){if(!ts)return'nie verifiziert';const mins=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/60000));return mins<60?`${mins} min`:`${Math.round(mins/60)} h`;}

function renderControls(){
  const host=document.getElementById('securityControls');if(!host)return;
  host.innerHTML=SECURITY_CONTROLS.map(c=>`<article class="security-control"><div><strong>${c.name}</strong><small>${c.category}</small></div><span class="status-chip unknown"><span class="dot"></span>${c.status}</span><p>Soll: ${c.expected}</p></article>`).join('');
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
  const s=securityGapSummary(FLOWS);
  host.innerHTML=`<div class="security-kpis"><div><small>Sicher</small><strong>${s.secure}</strong></div><div><small>Warnung</small><strong>${s.warning}</strong></div><div><small>Unsicher</small><strong>${s.insecure}</strong></div><div><small>Mit UNKNOWN</small><strong>${s.unknown}</strong></div></div><div class="security-action-list">${s.rows.filter(x=>x.status!=='SECURE').map(x=>`<div><strong>${x.flow.source} → ${x.flow.target}</strong><span>${x.issues.map(i=>i.message).join(' · ')}</span></div>`).join('')||'<div>Kein Security-Handlungsbedarf.</div>'}</div>`;
}

function ingest(flowId,observation){
  const flow=FLOWS.find(x=>x.id===flowId);if(!flow)throw new Error('Unknown security flow');
  const allowed=['transport','payloadEncryption','auth','keySource','lastVerifiedAt','trust','notes'];
  for(const k of allowed)if(Object.prototype.hasOwnProperty.call(observation,k))flow[k]=observation[k];
  render();return flow;
}
function render(){renderControls();renderTopology();renderMatrix();renderSummary();}
window.KICC_SECURITY={flows:FLOWS,controls:SECURITY_CONTROLS,ingest,summary:()=>securityGapSummary(FLOWS),render};
render();setInterval(render,30000);
