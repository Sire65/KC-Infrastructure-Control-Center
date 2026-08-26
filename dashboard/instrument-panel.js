const STATUS_MAP={HEALTHY:'healthy',ONLINE:'healthy',DEGRADED:'degraded',WARNING:'degraded',FAILED:'failed',OFFLINE:'failed',MAINTENANCE:'maintenance',TEST:'maintenance',UNKNOWN:'unknown',NOT_APPLICABLE:'unknown'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusClass=s=>STATUS_MAP[String(s||'UNKNOWN').toUpperCase()]||'unknown';
const normStatus=s=>String(s||'UNKNOWN').toUpperCase();

function allPrograms(){return [...(globalThis.KICC_PROGRAMS?.programs||[]),...(globalThis.KICC_NON_KC?.programs||[])];}
function databases(){return globalThis.KICC?.databases||[];}
function health(){try{return globalThis.KICC?.systemHealth?.()||null;}catch{return null;}}
function freshLatency(db){return Number.isFinite(db?.latencyMs)?db.latencyMs:null;}
function dbStatus(db){return normStatus(db?.status||db?.health||db?.runtimeHealth||'UNKNOWN');}
function programStatus(p){return normStatus(p?.status||p?.runtimeHealth||p?.health||'UNKNOWN');}
function primaryDb(){return databases().find(x=>String(x.role||'').includes('PRIMARY'))||null;}
function neonDb(){return databases().find(x=>String(x.provider||'').toLowerCase()==='neon')||null;}
function mirrorState(){const c=globalThis.KICC?.failoverContext||{};return c.mirrorReady===true?'HEALTHY':c.mirrorReady===false?'DEGRADED':'UNKNOWN';}
function bridgeState(){return normStatus(globalThis.KICC_GIT_BRIDGE?.state==='READY'?'HEALTHY':globalThis.KICC_GIT_BRIDGE?.state==='FAILED'?'FAILED':'UNKNOWN');}

function ledItem(label,status,detail=''){
  const s=normStatus(status);return `<div class="dash-led-item" title="${esc(detail||s)}"><span class="dash-led ${statusClass(s)}"></span><span><strong>${esc(label)}</strong><small>${esc(s)}</small></span></div>`;
}
function renderLeds(){const host=document.getElementById('dashboardStatusLeds');if(!host)return;
  const p=primaryDb(),n=neonDb();
  const programs=allPrograms(),known=programs.filter(x=>programStatus(x)!=='UNKNOWN');
  const programState=programs.some(x=>['FAILED','OFFLINE'].includes(programStatus(x)))?'FAILED':programs.some(x=>['DEGRADED','WARNING'].includes(programStatus(x)))?'DEGRADED':programs.length&&known.length===programs.length&&known.every(x=>['HEALTHY','ONLINE'].includes(programStatus(x)))?'HEALTHY':'UNKNOWN';
  const system=normStatus(health()?.status||'UNKNOWN');
  host.innerHTML=[
    ledItem('KC Gesamt',system,'Nur bestätigte KICC-Gesundheit'),
    ledItem('Programme',programState,`${known.length}/${programs.length} mit bekanntem Runtime-Status`),
    ledItem('Supabase',p?dbStatus(p):'UNKNOWN',p?.name||'Keine Primärdatenbank'),
    ledItem('Neon',n?dbStatus(n):'UNKNOWN',n?.name||'Kein Neon-Mirror'),
    ledItem('Mirror',mirrorState(),'Mirror-Readiness'),
    ledItem('Git Bridge',bridgeState(),globalThis.KICC_GIT_BRIDGE?.state||'nicht konfiguriert')
  ].join('');
}

function svgGauge({value,max=100,label,unit='',unknown=false}){
  const safe=unknown?0:Math.max(0,Math.min(max,Number(value)||0));
  const pct=safe/max;
  const angle=-120+pct*240;
  const text=unknown?'—':`${Math.round(safe)}${unit}`;
  return `<div class="svg-gauge"><svg viewBox="0 0 220 150" role="img" aria-label="${esc(label)}"><path class="gauge-track" d="M35 125 A85 85 0 1 1 185 125"/><line class="gauge-needle" x1="110" y1="125" x2="110" y2="52" transform="rotate(${angle} 110 125)"/><circle class="gauge-hub" cx="110" cy="125" r="6"/><text class="gauge-value" x="110" y="106" text-anchor="middle">${esc(text)}</text><text class="gauge-label" x="110" y="145" text-anchor="middle">${esc(label)}</text></svg></div>`;
}

function renderGaugeFallback(){
  const h=health(),coverage=Number.isFinite(h?.coverage)?h.coverage:null;
  const p=primaryDb(),lat=freshLatency(p);
  const programList=allPrograms(),known=programList.filter(x=>programStatus(x)!=='UNKNOWN').length;
  const programCoverage=programList.length?known/programList.length*100:null;
  document.getElementById('gaugeCoverage').innerHTML=svgGauge({value:coverage,max:100,label:'Messabdeckung',unit:'%',unknown:coverage==null});
  document.getElementById('gaugeLatency').innerHTML=svgGauge({value:lat,max:500,label:'Primär-DB Latenz',unit:' ms',unknown:lat==null});
  document.getElementById('gaugePrograms').innerHTML=svgGauge({value:programCoverage,max:100,label:'Programme gemessen',unit:'%',unknown:programCoverage==null});
}

function gaugeOption(value,max,label,unit){
  const unknown=value==null||!Number.isFinite(value);
  return {animationDuration:450,series:[{type:'gauge',min:0,max,splitNumber:5,startAngle:210,endAngle:-30,progress:{show:!unknown,width:8},axisLine:{lineStyle:{width:8}},axisTick:{distance:-12,length:4},splitLine:{distance:-15,length:8},axisLabel:{distance:13,fontSize:9},pointer:{show:!unknown,length:'58%',width:4},anchor:{show:!unknown,size:8},title:{offsetCenter:[0,'72%'],fontSize:11},detail:{valueAnimation:true,offsetCenter:[0,'34%'],fontSize:18,formatter:unknown?'—':`{value}${unit}`},data:[{value:unknown?0:value,name:label}]}]};
}
function useEchartsGauge(id,value,max,label,unit=''){
  const el=document.getElementById(id);if(!el||!globalThis.echarts)return false;
  const old=globalThis.echarts.getInstanceByDom(el);if(old)old.dispose();
  const chart=globalThis.echarts.init(el);chart.setOption(gaugeOption(value,max,label,unit));
  return true;
}
function renderGauges(){
  const h=health(),coverage=Number.isFinite(h?.coverage)?h.coverage:null;
  const p=primaryDb(),lat=freshLatency(p);
  const ps=allPrograms(),known=ps.filter(x=>programStatus(x)!=='UNKNOWN').length,pc=ps.length?known/ps.length*100:null;
  if(!globalThis.echarts){renderGaugeFallback();return;}
  useEchartsGauge('gaugeCoverage',coverage,100,'Messabdeckung','%');
  useEchartsGauge('gaugeLatency',lat,500,'Primär-DB Latenz',' ms');
  useEchartsGauge('gaugePrograms',pc,100,'Programme gemessen','%');
}

function renderStatusDistribution(){const host=document.getElementById('statusDistributionChart');if(!host)return;
  const items=[...allPrograms(),...databases()];
  const counts={HEALTHY:0,DEGRADED:0,FAILED:0,UNKNOWN:0};
  items.forEach(x=>{const s=x.type==='DATABASE'?dbStatus(x):programStatus(x);if(['HEALTHY','ONLINE'].includes(s))counts.HEALTHY++;else if(['DEGRADED','WARNING'].includes(s))counts.DEGRADED++;else if(['FAILED','OFFLINE'].includes(s))counts.FAILED++;else counts.UNKNOWN++;});
  if(globalThis.echarts){const old=globalThis.echarts.getInstanceByDom(host);if(old)old.dispose();const c=globalThis.echarts.init(host);c.setOption({animationDuration:400,grid:{left:36,right:12,top:18,bottom:30},xAxis:{type:'category',data:['Gesund','Warnung','Fehler','Unbekannt'],axisLabel:{fontSize:10}},yAxis:{type:'value',minInterval:1,axisLabel:{fontSize:9}},series:[{type:'bar',barMaxWidth:34,data:[counts.HEALTHY,counts.DEGRADED,counts.FAILED,counts.UNKNOWN],label:{show:true,position:'top'}}]});return;}
  host.innerHTML=`<div class="fallback-bars">${Object.entries(counts).map(([k,v])=>`<div><span>${esc(k)}</span><b style="--v:${Math.max(2,v*14)}px"></b><strong>${v}</strong></div>`).join('')}</div>`;
}
function renderLatencyChart(){const host=document.getElementById('databaseLatencyChart');if(!host)return;
  const rows=databases().map(d=>({name:d.name,value:freshLatency(d)})).filter(x=>x.value!=null);
  if(!rows.length){host.innerHTML='<div class="chart-empty">Noch keine bestätigten Latenzmessungen.</div>';return;}
  if(globalThis.echarts){const old=globalThis.echarts.getInstanceByDom(host);if(old)old.dispose();const c=globalThis.echarts.init(host);c.setOption({animationDuration:400,grid:{left:120,right:20,top:10,bottom:24},xAxis:{type:'value',name:'ms',axisLabel:{fontSize:9}},yAxis:{type:'category',data:rows.map(x=>x.name.replace(/^.*?·\s*/,'')),axisLabel:{fontSize:9,width:100,overflow:'truncate'}},series:[{type:'bar',data:rows.map(x=>x.value),label:{show:true,position:'right',formatter:'{c} ms'}}]});return;}
  host.innerHTML=`<div class="fallback-latency">${rows.map(x=>`<div><span>${esc(x.name)}</span><b style="width:${Math.min(100,x.value/5)}%"></b><strong>${Math.round(x.value)} ms</strong></div>`).join('')}</div>`;
}

function render(){renderLeds();renderGauges();renderStatusDistribution();renderLatencyChart();}
function schedule(){setTimeout(render,100);setTimeout(render,1200);}
window.addEventListener('resize',()=>{document.querySelectorAll('#dashboardInstruments .echart').forEach(el=>globalThis.echarts?.getInstanceByDom(el)?.resize());});
globalThis.KICC_DASHBOARD_INSTRUMENTS={render,schedule};
schedule();setInterval(render,15000);
