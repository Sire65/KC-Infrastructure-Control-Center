import { LOCAL_SECURITY_MIGRATION, migrationProgress, migrationBlockers } from './local-storage-migration-plan.js';

function cls(status){return status==='DONE'?'healthy':status==='FAILED'||status==='BLOCKED'?'failed':status==='RUNNING'?'maintenance':'unknown';}
function render(){
  const host=document.getElementById('localSecurityMigration');if(!host)return;
  const p=migrationProgress(),blockers=migrationBlockers();
  host.innerHTML=`<article class="migration-card"><div class="migration-head"><div><strong>Marktkasse · Plaintext → verschlüsseltes IndexedDB</strong><small>${LOCAL_SECURITY_MIGRATION.status} · ${LOCAL_SECURITY_MIGRATION.mode} · kein Auto-Cutover</small></div><span class="status-chip ${p.ready?'healthy':'unknown'}"><span class="dot"></span>${p.percent}%</span></div><div class="migration-progress"><div style="width:${p.percent}%"></div></div><div class="migration-meta"><span>Quelle: localStorage / JSON / unverschlüsselt</span><span>Ziel: IndexedDB / AES-256-GCM / versionierte Schlüssel</span><span>Offene Gates: ${blockers.length}</span></div><div class="migration-gates">${LOCAL_SECURITY_MIGRATION.gates.map(g=>`<div class="migration-gate"><span class="gate-mark ${g.status==='DONE'?'done':''}">${g.status==='DONE'?'✓':'·'}</span><div><strong>${g.label}</strong><small>${g.status}</small></div></div>`).join('')}</div><div class="migration-warning">Legacy-Daten bleiben erhalten. Cutover und spätere Plaintext-Löschung benötigen getrennte Freigaben.</div></article>`;
}
window.KICC_LOCAL_SECURITY_MIGRATION={plan:LOCAL_SECURITY_MIGRATION,progress:migrationProgress,blockers:migrationBlockers,render};
render();setInterval(render,30000);
