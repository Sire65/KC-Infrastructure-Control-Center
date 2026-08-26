import { VERSION_EVIDENCE_ROWS, VERSION_EVIDENCE_RULES, versionEvidenceSummary } from './version-evidence-model.js';

function chip(row){
  if(row.runtimeVerified)return '<span class="status-chip healthy"><span class="dot"></span>RUNTIME VERIFIED</span>';
  if(row.storageEncryption==='UNENCRYPTED')return '<span class="status-chip failed"><span class="dot"></span>LEGACY GAP</span>';
  return '<span class="status-chip degraded"><span class="dot"></span>TEILWEISE / UNKNOWN</span>';
}

function render(){
  const host=document.getElementById('securityVersionEvidence');if(!host)return;
  const s=versionEvidenceSummary();
  host.innerHTML=`<div class="security-kpis"><div><small>Varianten</small><strong>${s.total}</strong></div><div><small>Legacy deployed</small><strong>${s.deployed}</strong></div><div><small>Kandidaten</small><strong>${s.candidates}</strong></div><div><small>Runtime-verifiziert</small><strong>${s.runtimeVerified}</strong></div></div><div class="table-wrap"><table class="security-table"><thead><tr><th>Status</th><th>Produkt / Variante</th><th>Lebenszyklus</th><th>Quelle</th><th>Lokalspeicher</th><th>Verschlüsselung</th><th>Transport</th><th>Auth</th><th>Nachweis</th></tr></thead><tbody>${VERSION_EVIDENCE_ROWS.map(r=>`<tr><td>${chip(r)}</td><td>${r.product}<br><small>${r.variant}</small></td><td>${r.lifecycle}</td><td>${r.source}</td><td>${r.storage}</td><td>${r.storageEncryption}</td><td>${r.transport}</td><td>${r.auth}</td><td>${r.trust}<br><small>${r.note}</small></td></tr>`).join('')}</tbody></table></div><div class="security-action-list">${VERSION_EVIDENCE_RULES.map(x=>`<div><strong>Versionsregel</strong><span>${x}</span></div>`).join('')}</div>`;
}

globalThis.KICC_VERSION_EVIDENCE={rows:VERSION_EVIDENCE_ROWS,rules:VERSION_EVIDENCE_RULES,summary:versionEvidenceSummary,render};
render();
