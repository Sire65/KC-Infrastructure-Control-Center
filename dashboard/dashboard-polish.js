function fmtAge(ts){if(!ts)return'—';const s=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000));return s<60?`${s}s`:`${Math.round(s/60)}min`;}
function fmtRate(flow){const r=flow?.runCount24h??0,e=flow?.errorCount24h??0;if(!r)return'—';return `${((e/r)*100).toFixed(2)} %`;}
function ensureCss(){if(document.getElementById('kicc-dashboard-polish-css'))return;const s=document.createElement('style');s.id='kicc-dashboard-polish-css';s.textContent=`
.dashboard-grid{align-items:start}
.dashboard-grid>.panel{min-height:0}
#actions .action-stack{gap:8px}
#actions .action-item{padding:9px 10px}
#approvalCount.kicc-action-badge{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:22px;padding:0 8px;border:1px solid rgba(245,158,11,.42);border-radius:999px;background:rgba(245,158,11,.12);color:#fbbf24;font-weight:800;font-size:12px}
#topology .failover-topology{gap:10px}
#topology .flow-node{min-height:74px;padding:12px}
#topology .flow-state{padding:10px 12px;min-height:auto}
.kicc-mirror-mini{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:9px}
.kicc-mirror-mini>div{border:1px solid rgba(148,163,184,.16);background:rgba(15,23,42,.48);border-radius:9px;padding:7px 8px;min-width:0}
.kicc-mirror-mini small{display:block;color:#94a3b8;font-size:9px;margin-bottom:2px}.kicc-mirror-mini strong{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media(max-width:900px){.kicc-mirror-mini{grid-template-columns:repeat(2,1fr)}}
`;document.head.appendChild(s);}
function badge(){const el=document.getElementById('approvalCount');if(el)el.classList.add('kicc-action-badge');}
function mirrorDetails(){const host=document.querySelector('#topology .flow-state');const flow=globalThis.KICC_MIRROR?.flow;if(!host||!flow)return;let box=host.querySelector('.kicc-mirror-mini');if(!box){box=document.createElement('div');box.className='kicc-mirror-mini';host.appendChild(box);}box.innerHTML=`<div><small>Sync-Lag</small><strong>${Number.isFinite(flow.syncLagSec)?`${flow.syncLagSec}s`:'—'}</strong></div><div><small>Letzter Erfolg</small><strong>${fmtAge(flow.lastSuccessAt)}</strong></div><div><small>Fehlerquote 24h</small><strong>${fmtRate(flow)}</strong></div><div><small>Mismatches</small><strong>${flow.mismatchCount24h??'—'}</strong></div>`;}
function relabel(){const panel=[...document.querySelectorAll('.panel-head h2')].find(x=>x.textContent.trim()==='Handlungsbedarf');if(panel)panel.textContent='Handlungsbedarf';}
function apply(){ensureCss();badge();relabel();mirrorDetails();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
setInterval(apply,3000);
addEventListener('kicc:tabchange',apply);
globalThis.KICC_DASHBOARD_POLISH={apply};
