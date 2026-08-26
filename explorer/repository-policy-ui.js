import { PREPARED_REPOSITORY_ALLOWLIST, PREPARED_ALLOWLIST_STATE } from '../bridge/repository-allowlist.prepared.js';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function render(){
  const host=document.getElementById('repositoryPolicySummary');if(!host)return;
  const rows=PREPARED_REPOSITORY_ALLOWLIST.map(p=>`<tr><td>${esc(p.domain)}</td><td>${esc(`${p.owner}/${p.repo}`)}</td><td>${esc(p.branches.join(', '))}</td><td>${p.read?'✓':'—'}</td><td>${p.download?'✓':'—'}</td><td>${p.write?'✓':'gesperrt'}</td></tr>`).join('');
  host.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Bereich</th><th>Repository</th><th>Branch</th><th>Lesen</th><th>Download</th><th>Schreiben</th></tr></thead><tbody>${rows}</tbody></table></div><div class="db-note"><strong>${esc(PREPARED_ALLOWLIST_STATE)}</strong> · Deny-by-default. Schreibrechte sind in dieser Kandidatenliste bewusst deaktiviert.</div>`;
}
globalThis.KICC_REPOSITORY_POLICY_UI={render,policies:PREPARED_REPOSITORY_ALLOWLIST};
render();
