const VERSION='0.1.0-dev.2';
const MAX_AGE_MS=90_000;

const registry=[
  {id:'product-dp2',type:'PRODUCT',name:'KC DP2',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED'},
  {id:'product-kasse',type:'PRODUCT',name:'KC Marktkasse',role:'CURRENT candidate',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED'},
  {id:'provider-supabase',type:'PROVIDER',name:'Supabase',role:'CONFIGURED',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED'},
  {id:'provider-neon',type:'PROVIDER',name:'Neon',role:'CONFIGURED',status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED'}
];

function normalizeStatus(item){
  if(!item.measuredAt) return 'UNKNOWN';
  if(Date.now()-new Date(item.measuredAt).getTime()>MAX_AGE_MS) return 'UNKNOWN';
  return item.status || 'UNKNOWN';
}
function cssStatus(status){
  return ({HEALTHY:'healthy',ONLINE:'healthy',DEGRADED:'degraded',FAILED:'failed',OFFLINE:'failed',MAINTENANCE:'maintenance'})[status]||'unknown';
}
function overallStatus(items){
  const states=items.map(normalizeStatus);
  if(states.some(s=>s==='FAILED'||s==='OFFLINE')) return 'FAILED';
  if(states.some(s=>s==='DEGRADED')) return 'DEGRADED';
  if(states.length && states.every(s=>s==='HEALTHY'||s==='ONLINE')) return 'HEALTHY';
  return 'UNKNOWN';
}
function formatAge(ts){
  if(!ts) return 'nicht gemessen';
  const sec=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000));
  return sec<60?`${sec}s alt`:`${Math.round(sec/60)}min alt`;
}
function render(){
  document.getElementById('version').textContent=VERSION;
  const state=overallStatus(registry);
  const stateEl=document.getElementById('systemState');
  stateEl.className=`system-state ${cssStatus(state)}`;
  stateEl.querySelector('strong').textContent=state==='HEALTHY'?'BETRIEBSBEREIT':state==='FAILED'?'STÖRUNG':state==='DEGRADED'?'EINGESCHRÄNKT':'UNBEKANNT';

  const valid=registry.filter(x=>normalizeStatus(x)!=='UNKNOWN');
  const healthy=registry.filter(x=>['HEALTHY','ONLINE'].includes(normalizeStatus(x))).length;
  const failed=registry.filter(x=>['FAILED','OFFLINE'].includes(normalizeStatus(x))).length;
  const unknown=registry.filter(x=>normalizeStatus(x)==='UNKNOWN').length;
  const kpis=[
    ['Bestätigt gesund',healthy,'Komponenten'],['Störungen',failed,'aktuell'],['Unbekannt',unknown,'nicht bestätigt'],
    ['Live-Traffic','—','keine Messung'],['Latenz','—','keine Messung'],['Telemetrie',valid.length,'aktuell']
  ];
  document.getElementById('kpis').innerHTML=kpis.map(([label,value,unit])=>`<div class="kpi"><small>${label}</small><strong>${value}</strong><em>${unit}</em></div>`).join('');

  document.getElementById('registryRows').innerHTML=registry.map(item=>{
    const status=normalizeStatus(item); const cls=cssStatus(status);
    return `<tr><td><span class="status-chip ${cls}"><span class="dot"></span>${status}</span></td><td>${item.type}</td><td>${item.name}</td><td>${item.role}</td><td>${formatAge(item.measuredAt)}</td><td>${item.trust}</td></tr>`;
  }).join('');
}

window.KICC={version:VERSION,registry,ingestObservation(observation){
  const item=registry.find(x=>x.id===observation.targetId);
  if(!item) throw new Error('Unknown registry target');
  item.status=observation.status;
  item.measuredAt=observation.measuredAt||new Date().toISOString();
  item.trust=observation.trust||'OBSERVED';
  render();
}};

render();
setInterval(render,15_000);
