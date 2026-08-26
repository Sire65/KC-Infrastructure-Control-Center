let registration=null;
let waitingWorker=null;
let checking=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function css(){if(document.getElementById('kicc-update-style'))return;const s=document.createElement('style');s.id='kicc-update-style';s.textContent=`.kicc-update-panel{margin:0 0 14px;padding:12px;border:1px solid #263244;border-radius:12px;background:#0f172a}.kicc-update-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.kicc-update-head strong{font-size:12px}.kicc-update-state{font-size:10px;color:#94a3b8;text-align:right}.kicc-update-actions{display:flex;gap:7px;margin-top:9px;flex-wrap:wrap}.kicc-update-actions button{padding:7px 10px;border:1px solid #334155;border-radius:8px;background:#172033;color:#e5e7eb;cursor:pointer}.kicc-update-actions button.primary{background:#1d4ed8;border-color:#2563eb}.kicc-update-actions button:disabled{opacity:.45;cursor:default}.kicc-update-note{margin-top:7px;color:#64748b;font-size:9px}.kicc-update-meta{margin-top:7px;display:flex;gap:10px;flex-wrap:wrap;color:#94a3b8;font-size:9px}.kicc-update-meta strong{color:#dbeafe}`;document.head.appendChild(s);}
function host(){return document.getElementById('kiccPwaUpdate');}
function localVersion(){return globalThis.KICC?.version||document.getElementById('version')?.textContent?.trim()||'—';}
function setBusy(on){checking=on;const b=host()?.querySelector('[data-update="check"]');if(b){b.disabled=on;b.textContent=on?'Prüfe …':'Update prüfen';}}
function render(message=''){const h=host();if(!h)return;const ready=Boolean(waitingWorker);h.querySelector('.kicc-update-state').textContent=message||(ready?'UPDATE BEREIT':'AKTUELLER BUILD AKTIV');h.querySelector('[data-update="activate"]').disabled=!ready;const l=h.querySelector('[data-meta="local"]');if(l)l.textContent=localVersion();}
function bindWaiting(worker){if(!worker)return;waitingWorker=worker;render('Update vollständig vorgeladen · bereit zur Aktivierung');}
async function fetchRemoteVersion(){const url=new URL('./VERSION',location.href);url.searchParams.set('_',Date.now());const r=await fetch(url,{cache:'no-store',headers:{'cache-control':'no-cache'}});if(!r.ok)throw new Error(`VERSION HTTP ${r.status}`);return (await r.text()).trim();}
async function waitForWaiting(maxMs=8000){const started=Date.now();while(Date.now()-started<maxMs){if(registration?.waiting)return registration.waiting;const installing=registration?.installing;if(installing?.state==='installed')return installing;await sleep(250);}return null;}
async function check(){
  if(checking)return;
  setBusy(true);render('Prüfe lokalen und veröffentlichten Build …');
  try{
    let remote='—';
    try{remote=await fetchRemoteVersion();}catch(e){remote=`nicht lesbar (${e?.message||e})`;}
    const local=localVersion();const meta=host()?.querySelector('[data-meta="remote"]');if(meta)meta.textContent=remote;
    if(!registration){render(`Service Worker noch nicht bereit · lokal ${local} · veröffentlicht ${remote}`);return;}
    await registration.update();
    let worker=registration.waiting;
    if(!worker&&registration.installing)worker=await waitForWaiting();
    if(worker){bindWaiting(worker);return;}
    if(remote!=='—'&&!remote.startsWith('nicht lesbar')&&remote!==local){render(`Neuer Build ${remote} veröffentlicht · Service Worker lädt noch nicht. Einmal Seite neu laden und erneut prüfen.`);return;}
    render(`Kein neuer Build gefunden · lokal ${local}${remote!=='—'?` · veröffentlicht ${remote}`:''}`);
  }catch(e){render(`Update-Prüfung fehlgeschlagen: ${e?.message||e}`);}finally{setBusy(false);}
}
async function activate(){if(!waitingWorker){render('Noch kein vollständig vorgeladenes Update vorhanden. Erst „Update prüfen“ ausführen.');return;}render('Aktiviere vollständig vorgeladenen Build …');waitingWorker.postMessage({type:'KICC_ACTIVATE_UPDATE'});}
async function init(){
  if(!('serviceWorker' in navigator)){render('Service Worker nicht verfügbar.');return;}
  render('Service Worker wird initialisiert …');
  registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
  if(registration.waiting)bindWaiting(registration.waiting);
  registration.addEventListener('updatefound',()=>{const w=registration.installing;if(!w)return;render('Neuer Build gefunden · wird vollständig vorgeladen …');w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)bindWaiting(w);if(w.state==='redundant')render('Update konnte nicht installiert werden.');});});
  navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload());
  if(!waitingWorker)render('Update-System bereit.');
}
function mount(){css();const admin=document.querySelector('[data-kicc-panel="admin"]');if(!admin||host())return;const p=document.createElement('section');p.id='kiccPwaUpdate';p.className='kicc-update-panel';p.innerHTML=`<div class="kicc-update-head"><strong>PWA Update / Build-Aktivierung</strong><span class="kicc-update-state">Initialisiere …</span></div><div class="kicc-update-actions"><button data-update="check">Update prüfen</button><button class="primary" data-update="activate" disabled>Vorgeladenes Update aktivieren</button></div><div class="kicc-update-meta"><span>Lokal: <strong data-meta="local">${esc(localVersion())}</strong></span><span>Veröffentlicht: <strong data-meta="remote">—</strong></span></div><div class="kicc-update-note">Jede Prüfung liefert eine sichtbare Rückmeldung. Neue Builds werden erst vollständig vorgeladen und danach ausdrücklich aktiviert.</div>`;admin.insertBefore(p,admin.querySelector('.panel'));p.addEventListener('click',e=>{const b=e.target.closest('button[data-update]');if(!b)return;b.dataset.update==='check'?check():activate();});init().catch(e=>render(`Service-Worker-Fehler: ${e?.message||e}`));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();globalThis.KICC_UPDATE={check,activate,mount,state:()=>({waiting:Boolean(waitingWorker),scope:registration?.scope||null,checking})};
