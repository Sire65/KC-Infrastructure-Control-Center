const STATUS_MAP={HEALTHY:'healthy',ONLINE:'healthy',DEGRADED:'degraded',WARNING:'degraded',FAILED:'failed',OFFLINE:'failed',MAINTENANCE:'maintenance',TEST:'maintenance',UNKNOWN:'unknown',NOT_APPLICABLE:'unknown'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusClass=s=>STATUS_MAP[String(s||'UNKNOWN').toUpperCase()]||'unknown';
const normStatus=s=>String(s||'UNKNOWN').toUpperCase();

function allPrograms(){return [...(globalThis.KICC_PROGRAMS?.programs||[]),...(globalThis.KICC_NON_KC?.programs||[])];}
function databases(){return globalThis.KICC?.databases||[];}
function health(){try{return globalThis.KICC?.systemHealth?.()||null;}catch{return null;}}
function freshLatency(db){return Number.isFinite(db?.latencyMs)?Math.max(0,Math.round(db.latencyMs)):null;}
function dbStatus(db){return normStatus(db?.status||db?.health||db?.runtimeHealth||'UNKNOWN');}
function programStatus(p){return normStatus(p?.status||p?.runtimeHealth||p?.health||'UNKNOWN');}
function primaryDb(){return databases().find(x=>String(x.role||'').includes('PRIMARY'))||null;}
function neonDb(){return databases().find(x=>String(x.provider||'').toLowerCase()==='neon')||null;}
function mirrorState(){const c=globalThis.KICC?.failoverContext||{};return c.mirrorReady===true?'HEALTHY':c.mirrorReady===false?'DEGRADED':'UNKNOWN';}
function bridgeState(){return normStatus(globalThis.KICC_GIT_BRIDGE?.state==='READY'?'HEALTHY':globalThis.KICC_GIT_BRIDGE?.state==='FAILED'?'FAILED':'UNKNOWN');}
function dashboardVisible(){const panel=document.querySelector('[data-kicc-panel="dashboard"]');return Boolean(panel&&!panel.hidden);}

function ensureStructure(){
 const host=document.getElementById('dashboardInstruments');if(!host)return false;
 if(host.querySelector('[data-kicc-instrument-root]'))return true;
 host.innerHTML=`<section class="dashboard-instruments" data-kicc-instrument-root>
   <div id="dashboardStatusLeds" class="dash-led-strip"></div>
   <div class="instrument-grid">
    <article class="instrument-card"><div class="instrument-card-head"><strong>Messabdeckung</strong><span>bestätigte Telemetrie</span></div><div id="gaugeCoverage" class="gauge-host"></div></article>
    <article class="instrument-card"><div class="instrument-card-head"><strong>Primär-DB Latenz</strong><span>aktuelle Messung</span></div><div id="gaugeLatency" class="gauge-host"></div></article>
    <article class="instrument-card"><div class="instrument-card-head"><strong>Programme gemessen</strong><span>Runtime-Abdeckung</span></div><div id="gaugePrograms" class="gauge-host"></div></article>
    <article class="instrument-card chart-wide"><div class="instrument-card-head"><strong>Statusverteilung</strong><span>Programme + Datenbanken</span></div><div id="statusDistributionChart" class="chart-host"></div></article>
    <article class="instrument-card chart-wide"><div class="instrument-card-head"><strong>Datenbank-Latenzen</strong><span>nur bestätigte Messungen</span></div><div id="databaseLatencyChart" class="chart-host"></div></article>
   </div>
   <div class="instrument-truth-note">Lokale SVG/CSS-Instrumente · keine externe Chart-Bibliothek erforderlich · UNKNOWN bleibt UNKNOWN.</div>
 </section>`;
 return true;
}
function ledItem(label,status,detail=''){const s=normStatus(status);return `<div class="dash-led-item" title="${esc(detail||s)}"><span class="dash-led ${statusClass(s)}"></span><span><strong>${esc(label)}</strong><small>${esc(s)}</small></span></div>`;}
function renderLeds(){const host=document.getElementById('dashboardStatusLeds');if(!host)return;const p=primaryDb(),n=neonDb();const programs=allPrograms(),known=programs.filter(x=>programStatus(x)!=='UNKNOWN');const programState=programs.some(x=>['FAILED','OFFLINE'].includes(programStatus(x)))?'FAILED':programs.some(x=>['DEGRADED','WARNING'].includes(programStatus(x)))?'DEGRADED':programs.length&&known.length===programs.length&&known.every(x=>['HEALTHY','ONLINE'].includes(programStatus(x)))?'HEALTHY':'UNKNOWN';const system=normStatus(health()?.status||'UNKNOWN');host.innerHTML=[ledItem('KC Gesamt',system,'Nur bestätigte KICC-Gesundheit'),ledItem('Programme',programState,`${known.length}/${programs.length} mit bekanntem Runtime-Status`),ledItem('Supabase',p?dbStatus(p):'UNKNOWN',p?.name||'Keine Primärdatenbank'),ledItem('Neon',n?dbStatus(n):'UNKNOWN',n?.name||'Kein Neon-Mirror'),ledItem('Mirror',mirrorState(),'Mirror-Readiness'),ledItem('Git Bridge',bridgeState(),globalThis.KICC_GIT_BRIDGE?.state||'nicht konfiguriert')].join('');}

function svgGauge({value,max=100,label,unit='',unknown=false}){const safe=unknown?0:Math.max(0,Math.min(max,Number(value)||0));const pct=max>0?safe/max:0;const angle=-120+pct*240;const text=unknown?'—':`${Math.round(safe)}${unit}`;const tickAngles=[-120,-72,-24,24,72,120];return `<div class="svg-gauge professional"><svg viewBox="0 0 220 160" role="img" aria-label="${esc(label)}"><defs><filter id="shadow-${esc(label).replace(/\W/g,'')}"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".45"/></filter></defs><path class="gauge-track gauge-track-outer" d="M32 126 A88 88 0 1 1 188 126"/><path class="gauge-track gauge-track-inner" d="M39 126 A81 81 0 1 1 181 126"/>${tickAngles.map(a=>`<line class="gauge-tick" x1="110" y1="42" x2="110" y2="50" transform="rotate(${a} 110 126)"/>`).join('')}<line class="gauge-needle" x1="110" y1="126" x2="110" y2="57" transform="rotate(${angle} 110 126)" filter="url(#shadow-${esc(label).replace(/\W/g,'')})"/><circle class="gauge-hub gauge-hub-outer" cx="110" cy="126" r="9"/><circle class="gauge-hub" cx="110" cy="126" r="5"/><text class="gauge-value" x="110" y="105" text-anchor="middle">${esc(text)}</text><text class="gauge-label" x="110" y="151" text-anchor="middle">${esc(label)}</text></svg></div>`;}
function renderGauges(){const h=health(),coverage=Number.isFinite(h?.coverage)?Math.round(h.coverage):null;const p=primaryDb(),lat=freshLatency(p);const ps=allPrograms(),known=ps.filter(x=>programStatus(x)!=='UNKNOWN').length,pc=ps.length?Math.round(known/ps.length*100):null;document.getElementById('gaugeCoverage').innerHTML=svgGauge({value:coverage,max:100,label:'Messabdeckung',unit:'%',unknown:coverage==null});document.getElementById('gaugeLatency').innerHTML=svgGauge({value:lat,max:Math.max(500,Math.ceil((lat||0)/100)*100),label:'Primär-DB Latenz',unit:' ms',unknown:lat==null});document.getElementById('gaugePrograms').innerHTML=svgGauge({value:pc,max:100,label:'Programme gemessen',unit:'%',unknown:pc==null});}

function renderStatusDistribution(){const host=document.getElementById('statusDistributionChart');if(!host)return;const items=[...allPrograms(),...databases()];const counts={Gesund:0,Warnung:0,Fehler:0,Unbekannt:0};items.forEach(x=>{const s=x.type==='DATABASE'?dbStatus(x):programStatus(x);if(['HEALTHY','ONLINE'].includes(s))counts.Gesund++;else if(['DEGRADED','WARNING'].includes(s))counts.Warnung++;else if(['FAILED','OFFLINE'].includes(s))counts.Fehler++;else counts.Unbekannt++;});const max=Math.max(1,...Object.values(counts));host.innerHTML=`<div class="local-status-bars">${Object.entries(counts).map(([k,v])=>`<div class="local-status-row"><span>${esc(k)}</span><b><i class="${k.toLowerCase()}" style="width:${Math.max(v?4:0,v/max*100)}%"></i></b><strong>${v}</strong></div>`).join('')}</div>`;}
function renderLatencyChart(){const host=document.getElementById('databaseLatencyChart');if(!host)return;const rows=databases().map(d=>({name:d.name.replace(/^.*?·\s*/,''),value:freshLatency(d)})).filter(x=>x.value!=null);if(!rows.length){host.innerHTML='<div class="chart-empty">Noch keine bestätigten Latenzmessungen.</div>';return;}const max=Math.max(1,...rows.map(x=>x.value));host.innerHTML=`<div class="fallback-latency professional-bars">${rows.map(x=>`<div><span title="${esc(x.name)}">${esc(x.name)}</span><b><i style="width:${Math.max(3,x.value/max*100)}%"></i></b><strong>${Math.round(x.value)} ms</strong></div>`).join('')}</div>`;}
function render(){if(!ensureStructure())return;renderLeds();if(!dashboardVisible())return;renderGauges();renderStatusDistribution();renderLatencyChart();}
function schedule(){setTimeout(render,50);setTimeout(render,400);setTimeout(render,1200);}
function onTabChange(e){if(e?.detail?.tab==='dashboard'){requestAnimationFrame(render);setTimeout(render,120);}}
window.addEventListener('resize',()=>requestAnimationFrame(render));
window.addEventListener('orientationchange',()=>setTimeout(render,150));
window.addEventListener('kicc:tabchange',onTabChange);
globalThis.KICC_DASHBOARD_INSTRUMENTS={render,schedule,ensureStructure};
schedule();setInterval(render,15000);
