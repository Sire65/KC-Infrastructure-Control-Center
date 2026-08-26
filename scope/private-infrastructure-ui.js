function privateResources(){
  const dbs=(globalThis.KICC?.databases||[]).filter(x=>x.id==='db-neon-pc-backup').map(x=>({...x,domain:'PRIVATE'}));
  const stores=(globalThis.KICC_OBJECT_STORAGE?.stores||[]).map(x=>({...x,domain:'PRIVATE'}));
  return [...dbs,...stores];
}
function cls(s){return({HEALTHY:'healthy',ONLINE:'healthy',DEGRADED:'degraded',FAILED:'failed',OFFLINE:'failed'})[s]||'unknown';}
function render(){
  const host=document.getElementById('privateInfraCards');if(!host)return;
  const rows=privateResources();
  host.innerHTML=rows.map(x=>`<article class="db-card"><div class="db-title"><span class="status-chip ${cls(x.status||'UNKNOWN')}"><span class="dot"></span>${x.status||'UNKNOWN'}</span><strong>${x.name}</strong></div><div class="db-meta"><span>Bereich: PRIVAT</span><span>Typ: ${x.type||'DATABASE'}</span><span>Rolle: ${x.role||'—'}</span><span>Region: ${x.scope||'—'}</span></div><div class="db-note">Private Infrastruktur · beeinflusst keinen KC-Gesamtstatus und keine KC-Failoverentscheidung.</div></article>`).join('')||'<div class="empty-list">Keine private Infrastruktur registriert.</div>';

  const dbHost=document.getElementById('databaseCards');
  if(dbHost){[...dbHost.children].forEach(card=>{if(card.textContent.includes('PC Backup Vault'))card.remove();});}
  const registry=document.getElementById('registryRows');
  if(registry){[...registry.children].forEach(row=>{if(row.textContent.includes('PC Backup Vault')||row.textContent.includes('Backblaze B2'))row.remove();});}
}
window.KICC_PRIVATE_INFRA={resources:privateResources,render};
setTimeout(render,100);setInterval(render,15000);
