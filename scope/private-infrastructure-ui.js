const privateDb=[];

function detachPrivateDatabases(){
  const dbs=globalThis.KICC?.databases||[];
  for(let i=dbs.length-1;i>=0;i--){
    if(dbs[i]?.id==='db-neon-pc-backup'){
      privateDb.push({...dbs[i],domain:'PRIVATE'});
      dbs.splice(i,1);
    }
  }
}

function privateResources(){
  const stores=(globalThis.KICC_OBJECT_STORAGE?.stores||[]).map(x=>({...x,domain:'PRIVATE'}));
  return [...privateDb,...stores];
}
function cls(s){return({HEALTHY:'healthy',ONLINE:'healthy',DEGRADED:'degraded',FAILED:'failed',OFFLINE:'failed'})[s]||'unknown';}
function render(){
  const host=document.getElementById('privateInfraCards');if(!host)return;
  const rows=privateResources();
  host.innerHTML=rows.map(x=>`<article class="db-card"><div class="db-title"><span class="status-chip ${cls(x.status||'UNKNOWN')}"><span class="dot"></span>${x.status||'UNKNOWN'}</span><strong>${x.name}</strong></div><div class="db-meta"><span>Bereich: PRIVAT</span><span>Typ: ${x.type||'DATABASE'}</span><span>Rolle: ${x.role||'—'}</span><span>Region: ${x.scope||'—'}</span></div><div class="db-note">Private Infrastruktur · beeinflusst keinen KC-Gesamtstatus, keine KC-Abdeckung und keine KC-Failoverentscheidung.</div></article>`).join('')||'<div class="empty-list">Keine private Infrastruktur registriert.</div>';

  const registry=document.getElementById('registryRows');
  if(registry){[...registry.children].forEach(row=>{if(row.textContent.includes('PC Backup Vault')||row.textContent.includes('Backblaze B2'))row.remove();});}
}

detachPrivateDatabases();
window.KICC_PRIVATE_INFRA={resources:privateResources,render,privateDatabases:privateDb};
setTimeout(()=>{globalThis.KICC?.runDiscovery?.({force:true});render();},100);
setInterval(render,15000);
