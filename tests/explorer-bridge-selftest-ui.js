import { runExplorerBridgeSelfTests } from './explorer-bridge-selftest.js';

const state={running:false,last:null,error:null};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function render(){
  const host=document.getElementById('explorerBridgeSelfTest');if(!host)return;
  const r=state.last;
  const summary=r?`<strong>${r.status} · ${r.passed}/${r.total}</strong><span>${esc(r.profile)}</span><span>${esc(r.measuredAt)}</span>`:'<strong>NOCH NICHT AUSGEFÜHRT</strong><span>Read-only Selbsttest · keine Git-Schreibaktionen</span>';
  const rows=r?r.results.map(x=>`<tr><td>${x.ok?'✓':'✕'}</td><td>${esc(x.id)}</td><td>${esc(x.detail)}</td></tr>`).join(''):'';
  host.innerHTML=`<div class="explorer-policy"><div>${summary}</div><button type="button" id="runExplorerBridgeSelfTest" ${state.running?'disabled':''}>${state.running?'Prüfung läuft …':'Explorer/Bridge prüfen'}</button>${state.error?`<small>${esc(state.error)}</small>`:''}</div>${r?`<div class="table-wrap"><table><thead><tr><th>Status</th><th>Prüfung</th><th>Aussage</th></tr></thead><tbody>${rows}</tbody></table></div>`:''}`;
  host.querySelector('#runExplorerBridgeSelfTest')?.addEventListener('click',run);
}

async function run(){
  state.running=true;state.error=null;render();
  try{state.last=await runExplorerBridgeSelfTests();}
  catch(err){state.error=err?.message||'Selbsttest fehlgeschlagen';state.last=null;}
  state.running=false;render();
}

globalThis.KICC_TEST_UI={render,run,state};
render();
