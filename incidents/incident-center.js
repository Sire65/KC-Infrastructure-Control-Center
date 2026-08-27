const STORE_KEY='kicc.incidents.v1';
const CLEAN_REQUIRED=3;
let incidents=load();
let cleanCounts=new Map();

function load(){try{const v=JSON.parse(localStorage.getItem(STORE_KEY)||'[]');return Array.isArray(v)?v:[];}catch{return[];}}
function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(incidents.slice(-250)));}catch{}}
function now(){return new Date().toISOString();}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function statusClass(s){return s==='OPEN'?'failed':s==='OBSERVING'?'degraded':'healthy';}
function makeId(key){return `inc-${btoa(unescape(encodeURIComponent(key))).replace(/[^a-z0-9]/gi,'').slice(0,24)}`;}
function openOrTouch(signal){
  const current=incidents.find(x=>x.key===signal.key&&x.status!=='CLOSED');
  if(current){current.lastSeenAt=now();current.hits=(current.hits||1)+1;current.severity=signal.severity;current.impact=signal.impact;current.cause=signal.cause;current.source=signal.source;current.status='OPEN';cleanCounts.delete(signal.key);return current;}
  const item={id:makeId(`${signal.key}:${Date.now()}`),key:signal.key,status:'OPEN',severity:signal.severity||'ERROR',title:signal.title,cause:signal.cause||'Unbekannt',impact:signal.impact||'Noch nicht bewertet',source:signal.source||'KICC',affected:signal.affected||[],startedAt:now(),lastSeenAt:now(),endedAt:null,hits:1,recovery:null,measures:[],closure:null};
  incidents.push(item);cleanCounts.delete(signal.key);return item;
}
function observeHealthy(openIncident){
  const next=(cleanCounts.get(openIncident.key)||0)+1;cleanCounts.set(openIncident.key,next);
  openIncident.status=next>=CLEAN_REQUIRED?'CLOSED':'OBSERVING';
  if(next>=CLEAN_REQUIRED){openIncident.endedAt=now();openIncident.recovery='Ursachensignal in drei aufeinanderfolgenden Prüfungen nicht mehr vorhanden.';openIncident.closure='Automatisch geschlossen nach stabiler Entwarnung.';cleanCounts.delete(openIncident.key);}
}
function resourceSignals(){
  const resources=globalThis.KICC?.telemetry?.()||[];
  return resources.filter(r=>['FAILED','OFFLINE'].includes(String(r.status||'').toUpperCase())).map(r=>({key:`resource:${r.id}`,severity:'ERROR',title:`${r.id} ausgefallen`,cause:`Ressourcenstatus ${r.status}`,impact:'Abhängige Programme oder Datenwege können beeinträchtigt sein.',source:'KICC_RESOURCE_HEALTH',affected:[r.id]}));
}
function recoverySignals(){
  const latest=globalThis.KICC_BACKUP_TELEMETRY?.snapshot?.().latest||null;
  const gate=globalThis.KICC_RECOVERY_GATE?.evaluate?.(latest);
  if(gate?.state!=='BLOCKED')return[];
  return[{key:'recovery:blocked',severity:'ERROR',title:'Recovery-Nachweis gesperrt',cause:gate.reason,impact:'Kritische Änderungen dürfen nicht automatisch freigegeben werden.',source:'KICC_RECOVERY_GATE',affected:['backup-recovery']}];
}
function failoverSignals(){
  const f=globalThis.KICC?.currentFailoverState?.();
  if(!f||!['BLOCKED','FAILOVER_PENDING'].includes(f.state))return[];
  return[{key:`failover:${f.state}`,severity:'ERROR',title:f.state==='BLOCKED'?'Failover blockiert':'Primärdatenbank ausgefallen · Failover erforderlich',cause:f.reason||f.state,impact:'Datenbankverfügbarkeit bzw. Redundanz ist beeinträchtigt.',source:'KICC_FAILOVER',affected:['db-supabase-core','db-neon-core-mirror']}];
}
function collectSignals(){return[...resourceSignals(),...recoverySignals(),...failoverSignals()];}
function correlate(){
  const signals=collectSignals();const activeKeys=new Set(signals.map(x=>x.key));
  signals.forEach(openOrTouch);
  incidents.filter(x=>x.status!=='CLOSED'&&!activeKeys.has(x.key)).forEach(observeHealthy);
  save();render();
  globalThis.dispatchEvent(new CustomEvent('kicc:incidents',{detail:{active:incidents.filter(x=>x.status!=='CLOSED'),all:incidents}}));
}
function ensureUi(){
  if(document.querySelector('[data-kicc-tab="incidents"]'))return;
  const nav=document.querySelector('[data-kicc-tablist]');
  const admin=document.querySelector('[data-kicc-tab="admin"]');
  if(!nav)return;
  const button=document.createElement('button');button.className='leitstand-tab';button.dataset.kiccTab='incidents';button.setAttribute('role','tab');button.textContent='Störungen & Journal';nav.insertBefore(button,admin||null);
  const main=document.querySelector('main.shell');if(!main)return;
  const panel=document.createElement('section');panel.className='tab-panel';panel.dataset.kiccPanel='incidents';panel.setAttribute('role','tabpanel');panel.hidden=true;
  panel.innerHTML='<div class="tab-intro"><div><h2>Störungen & Journal</h2><p>Hauptursachen statt Alarmflut. Aktive Störungen werden korreliert und nach stabiler Entwarnung automatisch geschlossen.</p></div><span class="tab-badge">Dedupliziert</span></div><section class="panel db-panel"><div class="panel-head"><h2>Aktive Störungen</h2><span id="incidentActiveCount">0 aktiv</span></div><div id="incidentActive" class="database-grid"></div></section><section class="panel db-panel"><div class="panel-head"><h2>Journal</h2><span>lokal · append-orientiert</span></div><div class="table-wrap"><table><thead><tr><th>Status</th><th>Beginn</th><th>Störung</th><th>Ursache</th><th>Auswirkung</th><th>Treffer</th></tr></thead><tbody id="incidentJournalRows"></tbody></table></div></section>';
  const adminPanel=document.querySelector('[data-kicc-panel="admin"]');main.insertBefore(panel,adminPanel||null);
  button.addEventListener('click',()=>globalThis.KICC_NAV?.activateTab?.('incidents'));
}
function render(){
  ensureUi();
  const active=incidents.filter(x=>x.status!=='CLOSED').sort((a,b)=>new Date(b.lastSeenAt)-new Date(a.lastSeenAt));
  const host=document.getElementById('incidentActive');const count=document.getElementById('incidentActiveCount');
  if(count)count.textContent=`${active.length} aktiv`;
  if(host)host.innerHTML=active.length?active.map(x=>`<article class="db-card"><div class="db-title"><span class="status-chip ${statusClass(x.status)}"><span class="dot"></span>${x.status}</span><strong>${esc(x.title)}</strong></div><div class="db-meta"><span>Beginn: ${new Date(x.startedAt).toLocaleString('de-DE')}</span><span>Letzter Treffer: ${new Date(x.lastSeenAt).toLocaleString('de-DE')}</span><span>Ursache: ${esc(x.cause)}</span><span>Auswirkung: ${esc(x.impact)}</span></div><div class="db-note">Quelle: ${esc(x.source)} · Treffer: ${x.hits}</div></article>`).join(''):'<div class="empty-list">Keine aktive bestätigte Störung.</div>';
  const rows=document.getElementById('incidentJournalRows');if(rows)rows.innerHTML=[...incidents].reverse().slice(0,100).map(x=>`<tr><td><span class="status-chip ${statusClass(x.status)}"><span class="dot"></span>${x.status}</span></td><td>${new Date(x.startedAt).toLocaleString('de-DE')}</td><td>${esc(x.title)}</td><td>${esc(x.cause)}</td><td>${esc(x.impact)}</td><td>${x.hits}</td></tr>`).join('');
}
function addMeasure(id,text){const i=incidents.find(x=>x.id===id);if(!i)return false;i.measures.push({at:now(),text:String(text||'')});save();render();return true;}
function summary(){return{active:incidents.filter(x=>x.status!=='CLOSED'),closed:incidents.filter(x=>x.status==='CLOSED'),all:[...incidents]};}

function start(){ensureUi();render();correlate();setInterval(correlate,30_000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
globalThis.KICC_INCIDENTS={correlate,render,summary,addMeasure};
