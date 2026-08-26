import { runExplorerBridgeSelfTests } from './explorer-bridge-selftest.js';
import { saveExplorerBridgeTestResult, loadExplorerBridgeTestResult } from './explorer-bridge-test-store.js';

const state={running:false,last:null,error:null,loaded:false};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function render(){
  const host=document.getElementById('explorerBridgeSelfTest');if(!host)return;
  const r=state.last;
  const summary=r?`<strong>${r.status} · ${r.passed}/${r.total}</strong><span>${esc(r.profile)}</span><span>${esc(r.measuredAt)}</span>`:'<strong>NOCH NICHT AUSGEFÜHRT</strong><span>Read-only Selbsttest · keine Git-Schreibaktionen</span>';
  const rows=r?r.results.map(x=>`<tr><td>${x.ok?'✓':'✕'}</td><td>${esc(x.id)}</td><td>${esc(x.detail)}</td></tr>`).join(''):'';
  host.innerHTML=`<div class="explorer-policy"><div>${summary}${state.loaded?'<small>Letzter Prüfstand aus KICC-Diagnose-DB geladen</small>':''}</div><button type="button" id="runExplorerBridgeSelfTest" ${state.running?'disabled':''}>${state.running?'Prüfung läuft …':'Explorer/Bridge prüfen'}</button>${state.error?`<small>${esc(state.error)}</small>`:''}</div>${r?`<div class="table-wrap"><table><thead><tr><th>Status</th><th>Prüfung</th><th>Aussage</th></tr></thead><tbody>${rows}</tbody></table></div>`:''}`;
  host.querySelector('#runExplorerBridgeSelfTest')?.addEventListener('click',()=>run({manual:true}));
}

async function run({manual=false}={}){
  if(state.running)return state.last;
  state.running=true;state.error=null;render();
  try{
    state.last=await runExplorerBridgeSelfTests();
    try{await saveExplorerBridgeTestResult(state.last);}catch(err){state.error=`Test OK, Speicherung fehlgeschlagen: ${err?.message||'unbekannt'}`;}
  }catch(err){state.error=err?.message||'Selbsttest fehlgeschlagen';state.last=null;}
  state.running=false;state.loaded=false;render();
  globalThis.KICC_BRIDGE_READINESS_UI?.render?.();
  return state.last;
}

async function initialize(){
  try{
    const stored=await loadExplorerBridgeTestResult();
    if(stored?.result){state.last=stored.result;state.loaded=true;render();globalThis.KICC_BRIDGE_READINESS_UI?.render?.();return;}
  }catch(err){state.error=`Letzter Prüfstand nicht lesbar: ${err?.message||'unbekannt'}`;}
  await run({manual:false});
}

globalThis.KICC_TEST_UI={render,run,state,initialize};
render();initialize();
