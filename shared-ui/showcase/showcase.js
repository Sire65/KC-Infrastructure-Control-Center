const C={text:'#e9f0f7',muted:'#8fa2b7',grid:'#26364b',ok:'#33c481',warn:'#f4b740',bad:'#ef5b5b',blue:'#4da3ff',cyan:'#39d0d8',violet:'#9b7cff',bg:'#0d1a2b'};
const charts=[];
const el=id=>{const c=echarts.init(document.getElementById(id));charts.push(c);return c};
const axis={axisLine:{lineStyle:{color:C.grid}},axisLabel:{color:C.muted},splitLine:{lineStyle:{color:'#1f3044'}}};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const jitter=(v,amount,min,max)=>clamp(v+(Math.random()-.5)*amount,min,max);

const g1=el('g1');
g1.setOption({series:[{type:'gauge',min:0,max:200,startAngle:215,endAngle:-35,progress:{show:true,width:16},axisLine:{lineStyle:{width:16,color:[[.6,C.ok],[.8,C.warn],[1,C.bad]]}},axisTick:{distance:-22,length:6,lineStyle:{color:'#fff4',width:1}},splitLine:{distance:-24,length:13,lineStyle:{color:'#fff8',width:2}},axisLabel:{distance:26,color:C.muted,fontSize:10},pointer:{length:'62%',width:5,itemStyle:{color:C.text}},anchor:{show:true,size:13,itemStyle:{color:C.text}},title:{offsetCenter:[0,'70%'],color:C.muted},detail:{valueAnimation:true,fontSize:27,offsetCenter:[0,'38%'],color:C.text,formatter:'{value} ms'},data:[{value:42,name:'Antwortzeit'}]}]});

const g2=el('g2');
g2.setOption({series:[{type:'gauge',startAngle:180,endAngle:0,min:0,max:100,center:['50%','70%'],radius:'90%',progress:{show:true,width:18,roundCap:true,itemStyle:{color:C.blue}},axisLine:{lineStyle:{width:18,color:[[1,'#203247']]}},pointer:{show:false},axisTick:{show:false},splitLine:{show:false},axisLabel:{show:false},title:{offsetCenter:[0,'25%'],color:C.muted},detail:{valueAnimation:true,offsetCenter:[0,'-5%'],fontSize:32,color:C.text,formatter:'{value}%'},data:[{value:86,name:'System Health'}]}]});

const g3=el('g3');
g3.setOption({series:[{type:'gauge',startAngle:90,endAngle:-270,pointer:{show:false},progress:{show:true,overlap:false,roundCap:true,clip:false,itemStyle:{color:C.ok}},axisLine:{lineStyle:{width:18,color:[[1,'#203247']]}},splitLine:{show:false},axisTick:{show:false},axisLabel:{show:false},detail:{valueAnimation:true,fontSize:29,color:C.text,formatter:'{value}%'},title:{offsetCenter:[0,'68%'],color:C.muted},data:[{value:99.8,name:'Erfolgsquote'}]}]});

const g4=el('g4');
g4.setOption({series:[{type:'gauge',min:0,max:100,startAngle:90,endAngle:-270,pointer:{show:false},axisLine:{show:false},axisTick:{show:false},splitLine:{show:false},axisLabel:{show:false},progress:{show:true,roundCap:true,width:11},detail:{show:false},data:[{value:98}],radius:'90%',itemStyle:{color:C.ok}},{type:'gauge',min:0,max:100,startAngle:90,endAngle:-270,pointer:{show:false},axisLine:{show:false},axisTick:{show:false},splitLine:{show:false},axisLabel:{show:false},progress:{show:true,roundCap:true,width:11},detail:{show:false},data:[{value:92}],radius:'70%',itemStyle:{color:C.blue}},{type:'gauge',min:0,max:100,startAngle:90,endAngle:-270,pointer:{show:false},axisLine:{show:false},axisTick:{show:false},splitLine:{show:false},axisLabel:{show:false},progress:{show:true,roundCap:true,width:11},detail:{formatter:'{value}%',fontSize:25,color:C.text},data:[{value:96}],radius:'50%',itemStyle:{color:C.violet}}],graphic:[{type:'text',left:'center',top:'78%',style:{text:'Supabase 98 · Neon 92 · Local 96',fill:C.muted,font:'11px sans-serif'}}]});

const scale=el('scale');
scale.setOption({grid:{left:30,right:30,top:55,bottom:55},xAxis:{type:'value',min:0,max:100,...axis,axisLabel:{color:C.muted,formatter:'{value}%'}},yAxis:{show:false,type:'category',data:['']},series:[{type:'bar',data:[72],barWidth:24,itemStyle:{borderRadius:12,color:C.blue},showBackground:true,backgroundStyle:{color:'#203247',borderRadius:12},markLine:{symbol:'none',label:{color:C.muted,formatter:'Warn 80%'},lineStyle:{color:C.warn,type:'dashed'},data:[{xAxis:80}]}},{type:'scatter',data:[[72,0]],symbol:'diamond',symbolSize:18,itemStyle:{color:C.text}}]});

const bar=el('bar');
bar.setOption({grid:{left:42,right:16,top:30,bottom:35},tooltip:{trigger:'axis'},xAxis:{type:'category',data:['Mo','Di','Mi','Do','Fr','Sa','So'],...axis},yAxis:{type:'value',...axis},series:[{type:'bar',data:[120,180,150,260,310,420,290],barWidth:'48%',itemStyle:{borderRadius:[6,6,0,0],color:C.blue}}]});

const hbar=el('hbar');
hbar.setOption({grid:{left:88,right:22,top:20,bottom:25},xAxis:{type:'value',...axis},yAxis:{type:'category',data:['Push','E-Mail','SMS','WhatsApp'],...axis},series:[{type:'bar',data:[97,91,84,76],barWidth:17,itemStyle:{borderRadius:9,color:C.cyan},label:{show:true,position:'right',color:C.text,formatter:'{c}%'}}]});

const donut=el('donut');
donut.setOption({tooltip:{trigger:'item'},legend:{bottom:4,textStyle:{color:C.muted}},series:[{type:'pie',radius:['48%','72%'],center:['50%','45%'],avoidLabelOverlap:true,itemStyle:{borderColor:C.bg,borderWidth:3,borderRadius:8},label:{color:C.text,formatter:'{b}\n{d}%'},data:[{value:78,name:'OK',itemStyle:{color:C.ok}},{value:14,name:'Warnung',itemStyle:{color:C.warn}},{value:8,name:'Fehler',itemStyle:{color:C.bad}}]}]});

const pie3d=el('pie3d');
pie3d.setOption({series:[{type:'pie',radius:['35%','65%'],center:['50%','54%'],silent:true,label:{show:false},data:[{value:45,itemStyle:{color:'#214f72'}},{value:30,itemStyle:{color:'#5f4a8d'}},{value:25,itemStyle:{color:'#236a54'}}]},{type:'pie',radius:['35%','65%'],center:['50%','47%'],itemStyle:{borderColor:C.bg,borderWidth:2,shadowBlur:18,shadowColor:'#0008'},label:{color:C.text,formatter:'{b}\n{d}%'},data:[{value:45,name:'Supabase',itemStyle:{color:C.blue}},{value:30,name:'Neon',itemStyle:{color:C.violet}},{value:25,name:'Local',itemStyle:{color:C.ok}}]}]});

const line=el('line');
let lineData=[40,62,51,78,65,91,73];
line.setOption({grid:{left:42,right:16,top:25,bottom:35},xAxis:{type:'category',boundaryGap:false,data:['12','13','14','15','16','17','18'],...axis},yAxis:{type:'value',...axis},series:[{type:'line',smooth:true,data:lineData,symbolSize:7,lineStyle:{width:3,color:C.cyan},itemStyle:{color:C.cyan},areaStyle:{opacity:.18,color:C.cyan}}]});

const combo=el('combo');
let comboEvents=[110,180,240,330,280,390,220];
let comboSuccess=[97.2,98.1,99.2,98.8,99.7,99.4,99.8];
combo.setOption({legend:{top:0,textStyle:{color:C.muted}},grid:{left:45,right:50,top:40,bottom:35},xAxis:{type:'category',data:['08','10','12','14','16','18','20'],...axis},yAxis:[{type:'value',name:'Events',nameTextStyle:{color:C.muted},...axis},{type:'value',name:'Erfolg %',min:90,max:100,nameTextStyle:{color:C.muted},...axis}],series:[{name:'Events',type:'bar',data:comboEvents,itemStyle:{color:C.blue,borderRadius:[5,5,0,0]}},{name:'Erfolg %',type:'line',yAxisIndex:1,smooth:true,data:comboSuccess,lineStyle:{width:3,color:C.ok},itemStyle:{color:C.ok}}]});

const radar=el('radar');
radar.setOption({radar:{radius:'66%',indicator:[{name:'Performance',max:100},{name:'Sicherheit',max:100},{name:'Sync',max:100},{name:'Backup',max:100},{name:'Verfügbarkeit',max:100}],axisName:{color:C.muted},splitLine:{lineStyle:{color:'#29405b'}},splitArea:{areaStyle:{color:['#0f2034','#0c1a2b']}},axisLine:{lineStyle:{color:'#29405b'}}},series:[{type:'radar',data:[{value:[88,94,97,91,99],name:'KC System',areaStyle:{opacity:.25,color:C.blue},lineStyle:{color:C.blue,width:2},itemStyle:{color:C.blue}}]}]});

// Live-Demo: Die Showcase-Seite besitzt noch keine produktive Telemetriequelle.
// Deshalb werden plausible Messwerte laufend simuliert. In den KC-Leitständen
// wird dieselbe updateLive()-Logik später mit echten Health-/Traffic-Daten gespeist.
const state={latency:42,health:86,success:99.8,supa:98,neon:92,local:96,load:72};
function updateLive(){
  state.latency=Math.round(jitter(state.latency,32,12,185));
  state.health=Math.round(jitter(state.health,8,68,100));
  state.success=+jitter(state.success,.8,96.5,100).toFixed(1);
  state.supa=Math.round(jitter(state.supa,4,88,100));
  state.neon=Math.round(jitter(state.neon,5,82,100));
  state.local=Math.round(jitter(state.local,3,90,100));
  state.load=Math.round(jitter(state.load,14,25,96));

  g1.setOption({series:[{data:[{value:state.latency,name:'Antwortzeit'}]}]});
  g2.setOption({series:[{data:[{value:state.health,name:'System Health'}]}]});
  g3.setOption({series:[{data:[{value:state.success,name:'Erfolgsquote'}]}]});
  g4.setOption({series:[{data:[{value:state.supa}]},{data:[{value:state.neon}]},{data:[{value:state.local}]}],graphic:[{style:{text:`Supabase ${state.supa} · Neon ${state.neon} · Local ${state.local}`}}]});
  scale.setOption({series:[{data:[state.load]},{data:[[state.load,0]]}]});

  lineData=[...lineData.slice(1),Math.round(jitter(lineData.at(-1),30,20,100))];
  line.setOption({series:[{data:lineData}]});

  comboEvents=[...comboEvents.slice(1),Math.round(jitter(comboEvents.at(-1),140,80,470))];
  comboSuccess=[...comboSuccess.slice(1),+jitter(comboSuccess.at(-1),1.2,94,100).toFixed(1)];
  combo.setOption({series:[{data:comboEvents},{data:comboSuccess}]});
}

setInterval(updateLive,1200);
window.addEventListener('resize',()=>charts.forEach(c=>c.resize()));
