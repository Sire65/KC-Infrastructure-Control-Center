import { validateRuntimeAttestation, evaluateStorageProtection, makeRuntimeAttestationTemplate, RUNTIME_ATTESTATION_RULES } from './runtime-security-attestation.js';

const ATTESTATIONS=[];

function cls(status){return({SECURE:'healthy',INSECURE:'failed',WARNING:'degraded'})[status]||'unknown';}
function render(){
  const host=document.getElementById('runtimeSecurityAttestations');if(!host)return;
  const rows=ATTESTATIONS.map(a=>{const v=validateRuntimeAttestation(a),e=evaluateStorageProtection(a);return `<tr><td><span class="status-chip ${cls(e.status)}"><span class="dot"></span>${e.status}</span></td><td>${a.productId||'—'}</td><td>${a.variant||'—'}</td><td>${a.version||'—'}</td><td><code>${a.buildFingerprint||'—'}</code></td><td>${a.storage?.engine||'UNKNOWN'}</td><td>${a.storage?.payloadEncryption||'UNKNOWN'}</td><td>${a.storage?.keyVersion||'—'}</td><td>${v.fresh?'frisch':'nicht frisch'}</td><td>${e.reason}</td></tr>`;}).join('');
  host.innerHTML=`<div class="security-kpis"><div><small>Runtime-Attestationen</small><strong>${ATTESTATIONS.length}</strong></div><div><small>Verifiziert sicher</small><strong>${ATTESTATIONS.filter(a=>evaluateStorageProtection(a).status==='SECURE').length}</strong></div><div><small>Unsicher</small><strong>${ATTESTATIONS.filter(a=>evaluateStorageProtection(a).status==='INSECURE').length}</strong></div><div><small>Unklar</small><strong>${ATTESTATIONS.filter(a=>!['SECURE','INSECURE'].includes(evaluateStorageProtection(a).status)).length}</strong></div></div><div class="table-wrap"><table class="security-table"><thead><tr><th>Status</th><th>Produkt</th><th>Variante</th><th>Version</th><th>Build-Fingerprint</th><th>Speicher</th><th>Verschlüsselung</th><th>Key-Version</th><th>Frische</th><th>Bewertung</th></tr></thead><tbody>${rows||'<tr><td colspan="10">Noch keine autoritative Runtime-Attestation empfangen.</td></tr>'}</tbody></table></div><div class="security-action-list">${RUNTIME_ATTESTATION_RULES.map(x=>`<div><strong>Attestationsregel</strong><span>${x}</span></div>`).join('')}</div>`;
}

function ingest(attestation){
  const v=validateRuntimeAttestation(attestation);if(!v.ok)throw new Error(`Invalid runtime security attestation: ${v.issues.join(', ')}`);
  const i=ATTESTATIONS.findIndex(x=>x.productId===attestation.productId&&x.variant===attestation.variant&&x.buildFingerprint===attestation.buildFingerprint);
  if(i>=0)ATTESTATIONS[i]={...attestation};else ATTESTATIONS.push({...attestation});
  render();
  return evaluateStorageProtection(attestation);
}

globalThis.KICC_RUNTIME_SECURITY={attestations:ATTESTATIONS,ingest,render,template:makeRuntimeAttestationTemplate};
render();
