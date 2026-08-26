import { ingestHeartbeat,listHeartbeats,effectiveStatus } from './device-heartbeat-model.js';

const TAB_ID='devices';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function age(ts){if(!ts)return'—';const s=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000));return s<60?`${s}s`:`${Math.round(s/60)}min`;}
function dot(status){return status==='ONLINE'?'#22c55e':status==='DEGRADED'?'#f59e0b':status==='OFFLINE'?'#ef4444':status==='MAINTENANCE'?'#3b82f6':'#64748b';}
function traffic(hb){const total=(hb.trafficRx||0)+(hb.trafficTx||0);return total>0?'AKTIV':'—';}
function ensureCss(){if(document.getElementById('kicc-device-css'))return;const s=document.createElement('style');s.id='kicc-device-css';s.textContent=`.device-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:10px}.device-kpi,.device-table-wrap{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.72);border-radius:12px}.device-kpi{padding:10px}.device-kpi small{display:block;color:#94a3b8;font-size:10px}.device-kpi strong{font-size:18px}.device-table-wrap{overflow:auto}.device-table{width:100%;border-collapse:collapse;font-size:12px}.device-table th,.device-table td{padding:9px 10px;border-bottom:1px solid rgba(148,163,184,.12);text-align:left;white-space:nowrap}.device-led{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;box-shadow:0 0 8px currentColor}.device-note{font-size:11px;color:#94a3b8;margin:8px 0 0}@media(max-width:850px){.device-summary{grid-template-columns:repeat(2,1fr)}}`;document.head.appendChild(s);}
function ensureUi(){
  ensureCss();
  const tablist=document.querySelector('[data-kicc-tablist]');
  if(tablist&&!tablist.querySelector(`[data-kicc-tab="${TAB_ID}"]`)){
    const b=document.createElement('button');b.type='button';b.dataset.kiccTab=TAB_ID;b.setAttribute('role','tab');b.setAttribute('aria-selected','false');b.textContent='Geräte & Clients';tablist.appendChild(b);
  }
  const main=document.querySelector('main');
  if(main&&!document.querySelector(`[data-kicc-panel="${TAB_ID}"]`)){
    const section=document.createElement('section');section.dataset.kiccPanel=TAB_ID;section.hidden=true;section.innerHTML=`<div class="panel"><div class="panel-head"><div><h2>Geräte & Clients</h2><p>Nur echte Heartbeats. Keine Rückmeldung = UNKNOWN/OFFLINE nach Frist.</p></div><span class="tab-badge">Heartbeat</span></div><div id="kiccDeviceCenter"></div></div>`;main.appendChild(section);
  }
}
function localHeartbeat(){
  const nav=navigator;
  ingestHeartbeat({deviceId:`browser:${location.origin}`,name:'KICC Browser',deviceType:'BROWSER',programId:'kicc',version:globalThis.KICC?.version||null,status:navigator.onLine?'ONLINE':'OFFLINE',measuredAt:new Date().toISOString(),latencyMs:0,trafficRx:0,trafficTx:0,source:'BROWSER_RUNTIME',trust:'OBSERVED_LOCAL'});
}
function render(){
  const host=document.getElementById('kiccDeviceCenter');if(!host)return;
  const rows=listHeartbeats(),states=rows.map(h=>effectiveStatus(h));
  const online=states.filter(x=>x==='ONLINE').length,offline=states.filter(x=>x==='OFFLINE').length,unknown=states.filter(x=>x==='UNKNOWN').length;
  host.innerHTML=`<div class="device-summary"><div class="device-kpi"><small>Registriert/gemessen</small><strong>${rows.length}</strong></div><div class="device-kpi"><small>Online</small><strong>${online}</strong></div><div class="device-kpi"><small>Offline</small><strong>${offline}</strong></div><div class="device-kpi"><small>Unknown</small><strong>${unknown}</strong></div></div><div class="device-table-wrap"><table class="device-table"><thead><tr><th>Status</th><th>Gerät</th><th>Typ</th><th>Programm</th><th>Version</th><th>Letzter Kontakt</th><th>Latenz</th><th>Traffic</th><th>Quelle</th></tr></thead><tbody>${rows.length?rows.map(h=>{const st=effectiveStatus(h);return `<tr><td><span class="device-led" style="background:${dot(st)};color:${dot(st)}"></span>${st}</td><td>${esc(h.name)}</td><td>${esc(h.deviceType)}</td><td>${esc(h.programId||'—')}</td><td>${esc(h.version||'—')}</td><td>${age(h.measuredAt)}</td><td>${Number.isFinite(h.latencyMs)?`${h.latencyMs} ms`:'—'}</td><td>${traffic(h)}</td><td>${esc(h.source)}</td></tr>`;}).join(''):'<tr><td colspan="9">Noch keine Heartbeats empfangen.</td></tr>'}</tbody></table></div><div class="device-note">Status und Datenverkehr sind getrennt. Ein erreichbares Gerät wird nicht automatisch als aktiv sendend dargestellt.</div>`;
}

ensureUi();localHeartbeat();render();
setInterval(()=>{localHeartbeat();render();},15_000);
addEventListener('online',()=>{localHeartbeat();render();});addEventListener('offline',()=>{localHeartbeat();render();});
globalThis.KICC_DEVICES={ingest(hb){const out=ingestHeartbeat(hb);render();return out;},list:listHeartbeats,render};
