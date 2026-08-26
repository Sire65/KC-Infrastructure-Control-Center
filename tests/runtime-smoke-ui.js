import { runRuntimeSmoke } from './runtime-smoke.js';

const state={running:false,last:null,error:null};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function render(){
  const host=document.getElementById('runtimeSmoke');if(!host)return;
  const r=state.last;
  const summary=r?`<strong>${esc(r.status)} · ${r.passed}/${r.total}</strong><span>${esc(r.measuredAt)}</span>`:'<strong>NOCH NICHT AUSGEFÜHRT</strong><span>Boot-/Runtime-Smoke · read-only</span>';
  const rows=r?r.results.map(x=>`<tr><td>${x.ok?'✓':'✕'}</td><td>${esc(x.id)}</td><td>${esc(x.detail)}</td></tr>`).join(''):'';
  host.innerHTML=`<div class="explorer-policy"><div>${summary}</div><button type="button" id="runRuntimeSmoke" ${state.running?'disabled':''}>${state.running?'Prüfung läuft …':'Runtime prüfen'}</button>${state.error?`<small>${esc(state.error)}</small>`:''}</div>${r?`<div class="table-wrap"><table><thead><tr><th>Status</th><th>Prüfung</th><th>Aussage</th></tr></thead><tbody>${rows}</tbody></table></div>`:''}`;
  host.querySelector('#runRuntimeSmoke')?.addEventListener('click',run);
}

async function run(){
  state.running=true;state.error=null;render();
  try{state.last=await runRuntimeSmoke();}
  catch(err){state.error=err?.message||'Runtime-Smoke fehlgeschlagen';state.last=null;}
  state.running=false;render();
}

globalThis.KICC_RUNTIME_SMOKE_UI={state,render,run};
render();
setTimeout(run,700);
