import { makeObjectStorageResource, summarizeObjectStorage } from './object-storage-model.js';

const MAX_AGE_MS=90000;
const stores=[makeObjectStorageResource({id:'storage-b2-pc',name:'Backblaze B2 · PC Backup Vault · Bucket pc',provider:'Backblaze B2',role:'MASS_BACKUP',scope:'remote',adapterId:'telemetry-bridge',capabilities:['health','latency','capacity','usage','objectCount','upload','download','integrity','encryption','retention','restoreTest']})];

function fresh(x){return Boolean(x.measuredAt)&&Date.now()-new Date(x.measuredAt).getTime()<=MAX_AGE_MS;}
function status(x){return fresh(x)?(x.status||'UNKNOWN'):'UNKNOWN';}
function cls(s){return({HEALTHY:'healthy',ONLINE:'healthy',DEGRADED:'degraded',FAILED:'failed',OFFLINE:'failed'})[s]||'unknown';}
function age(ts){if(!ts)return'nicht gemessen';const sec=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000));return sec<60?`${sec}s alt`:`${Math.round(sec/60)}min alt`;}
function bytes(v){if(!Number.isFinite(v))return'—';const u=['B','KB','MB','GB','TB'];let n=v,i=0;while(n>=1024&&i<u.length-1){n/=1024;i++;}return`${n.toFixed(i?1:0)} ${u[i]}`;}
function endpoint(store){return globalThis.KICC_BRIDGE_ENDPOINTS?.[store.id]||null;}

async function probe(store){
  const ep=endpoint(store);
  if(!ep){Object.assign(store,{status:'UNKNOWN',trust:'UNVERIFIED',message:'B2-Telemetrie-Bridge noch nicht angebunden.'});return;}
  const headers={accept:'application/json'};
  if(typeof globalThis.KICC_AUTH?.getObjectStorageBridgeAuth==='function'){
    const auth=await globalThis.KICC_AUTH.getObjectStorageBridgeAuth(store.id);
    if(auth?.authorization)headers.authorization=auth.authorization;
  }
  try{
    const r=await fetch(ep,{headers,cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const p=await r.json();if(p.targetId!==store.id)throw new Error('target mismatch');
    Object.assign(store,{status:p.status||'UNKNOWN',measuredAt:p.measuredAt||new Date().toISOString(),trust:'OBSERVED_REMOTE',capacity:p.capacity??null,usage:p.usage??null,objectCount:p.objectCount??null,lastUpload:p.lastUpload??null,lastIntegrityCheck:p.lastIntegrityCheck??null,lastRestoreTest:p.lastRestoreTest??null,message:p.message||'B2-Telemetrie aktiv.'});
  }catch(e){Object.assign(store,{status:navigator.onLine?'DEGRADED':'OFFLINE',measuredAt:new Date().toISOString(),trust:'OBSERVED_REMOTE',message:e instanceof Error?e.message:String(e)});}
}

function render(){
  const host=document.getElementById('storageCards');if(host){host.innerHTML=stores.map(store=>{const s=status(store),c=cls(s),m=summarizeObjectStorage(store);return`<article class="db-card"><div class="db-title"><span class="status-chip ${c}"><span class="dot"></span>${s}</span><strong>${store.name}</strong></div><div class="db-meta"><span>Rolle: ${store.role}</span><span>Nutzung: ${bytes(m.usage)}${Number.isFinite(m.capacity)?` / ${bytes(m.capacity)}`:''}</span><span>Objekte: ${Number.isFinite(m.objectCount)?m.objectCount:'—'}</span><span>Messung: ${age(store.measuredAt)}</span></div><div class="caps"><span class="cap ${store.lastUpload?'available':'unknown'}">Upload</span><span class="cap ${store.lastIntegrityCheck?'available':'unknown'}">Integrität</span><span class="cap ${store.lastRestoreTest?'available':'unknown'}">Restore-Test</span><span class="cap ${endpoint(store)?'available':'unknown'}">Bridge</span></div><div class="db-note">${store.message||'Massenspeicher für verschlüsselte PC-Backups.'}</div></article>`;}).join('');}
  const tbody=document.getElementById('registryRows');if(tbody){document.querySelectorAll('tr[data-kicc-object-storage]').forEach(x=>x.remove());for(const store of stores){const s=status(store),tr=document.createElement('tr');tr.dataset.kiccObjectStorage='1';tr.innerHTML=`<td><span class="status-chip ${cls(s)}"><span class="dot"></span>${s}</span></td><td>OBJECT_STORAGE</td><td>${store.name}</td><td>${store.role}</td><td>${age(store.measuredAt)}</td><td>${store.trust}</td>`;tbody.appendChild(tr);}}
}

async function refresh(){await Promise.all(stores.map(probe));render();}
window.KICC_OBJECT_STORAGE={stores,refresh,summary:()=>stores.map(summarizeObjectStorage)};
refresh();setInterval(refresh,60000);setInterval(render,15000);
