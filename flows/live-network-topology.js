const LIVE_WINDOW_MS=45_000;
const PARTICLE_TTL_MS=3_000;
const renderedEvents=new Set();

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function flows(){return globalThis.KICC_PROGRAM_FLOWS?.recent?.(LIVE_WINDOW_MS)||[];}
function programs(){return globalThis.KICC_PROGRAMS?.programs||[];}
function databases(){return globalThis.KICC?.databases||[];}
function runtime(){return globalThis.KICC?.registry||[];}
function normalizeId(v){return String(v||'').replace(/^program:/,'');}
function statusColor(e){const s=String(e.status||'UNKNOWN').toUpperCase();if(s==='FAILED'||s==='OFFLINE')return'#ef4444';if(s==='DEGRADED'||s==='WARN'||s==='WARNING')return'#f59e0b';if(String(e.type||'').toUpperCase()==='HEARTBEAT'||String(e.dataClass||'').toUpperCase()==='TELEMETRY')return'#3b82f6';if(s==='OK'||s==='HEALTHY'||s==='ONLINE')return'#22c55e';return'#94a3b8';}
function statusLabel(e){const s=String(e.status||'UNKNOWN').toUpperCase();if(String(e.type||'').toUpperCase()==='HEARTBEAT'||String(e.dataClass||'').toUpperCase()==='TELEMETRY')return'Telemetrie';if(s==='OK'||s==='HEALTHY'||s==='ONLINE')return'OK';if(s==='DEGRADED'||s==='WARN'||s==='WARNING')return'Warnung';if(s==='FAILED'||s==='OFFLINE')return'Fehler';return'Unbekannt';}
function iconFor(node){if(node.kind==='database')return'▰';if(node.kind==='runtime')return'▣';if(node.kind==='server')return'▤';return'▦';}
function collectNodes(events){const map=new Map();
  for(const p of programs())map.set(p.id,{id:p.id,label:p.name||p.id,kind:'program',meta:p.role||'KC-Programm'});
  for(const d of databases())map.set(d.id,{id:d.id,label:d.name||d.id,kind:'database',meta:d.role||d.provider||'Datenbank'});
  for(const r of runtime())map.set(r.id,{id:r.id,label:r.name||r.id,kind:'runtime',meta:r.role||'Runtime'});
  for(const e of events){for(const raw of [e.from,e.to]){const id=normalizeId(raw);if(!id||map.has(id))continue;const lower=id.toLowerCase();const kind=lower.includes('supabase')||lower.includes('neon')||lower.includes('indexeddb')?'database':lower.includes('server')||lower.includes('bridge')||lower.includes('worker')?'server':'program';map.set(id,{id,label:id,kind,meta:'beobachtet'});}}
  return [...map.values()];
}
function layout(nodes,w,h){const cols={program:[],runtime:[],server:[],database:[]};for(const n of nodes)(cols[n.kind]||cols.program).push(n);const x={program:w*.12,runtime:w*.35,server:w*.58,database:w*.84};const out=new Map();for(const [kind,list] of Object.entries(cols)){const usable=Math.max(1,h-90);list.forEach((n,i)=>{const y=55+(i+1)*usable/(list.length+1);out.set(n.id,{...n,x:x[kind],y});});}return out;}
function lineKey(e){return`${normalizeId(e.from)}→${normalizeId(e.to)}`;}
function eventKey(e){return e.id||e.eventId||`${lineKey(e)}|${e.type||''}|${e.measuredAt||''}|${e.correlationId||''}`;}
function ensureCss(){if(document.querySelector('[data-kicc-live-topology-css]'))return;const s=document.createElement('style');s.dataset.kiccLiveTopologyCss='1';s.textContent=`
#topology.kicc-live-map{position:relative;min-height:430px;overflow:hidden;background:radial-gradient(circle at 50% 45%,#10213a 0,#081321 58%,#060d17 100%);border-radius:12px}.kicc-map-svg{width:100%;height:430px;display:block}.kicc-link{stroke:#334155;stroke-width:2;fill:none}.kicc-link.active{stroke:#64748b}.kicc-node rect{fill:#0f1c2d;stroke:#41556f;stroke-width:1.3;rx:10}.kicc-node text{fill:#e5edf7;font:12px Segoe UI,Arial,sans-serif}.kicc-node .meta{fill:#8fa2b7;font-size:10px}.kicc-node .ico{fill:#60a5fa;font-size:18px}.kicc-particle{filter:drop-shadow(0 0 5px currentColor)}.kicc-map-legend{position:absolute;left:10px;bottom:9px;display:flex;gap:10px;flex-wrap:wrap;background:#07111ee6;border:1px solid #27364b;border-radius:9px;padding:6px 8px;font-size:10px;color:#b7c4d4}.kicc-map-legend span{display:flex;align-items:center;gap:5px}.kicc-map-legend i{width:8px;height:8px;border-radius:50%;display:inline-block}.kicc-live-badge{position:absolute;right:10px;top:10px;background:#07111ee6;border:1px solid #27364b;border-radius:9px;padding:6px 8px;font-size:10px;color:#b7c4d4}.kicc-live-badge strong{color:#22c55e}.kicc-live-badge.none strong{color:#94a3b8}`;document.head.appendChild(s);}
function svgEl(name,attrs={}){const e=document.createElementNS('http://www.w3.org/2000/svg',name);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;}
function render(){const host=document.getElementById('topology');if(!host)return;ensureCss();const events=flows().filter(e=>e.from&&e.to);const nodes=collectNodes(events);const width=Math.max(760,host.clientWidth||760),height=430,pos=layout(nodes,width,height);host.className='topology kicc-live-map';host.innerHTML='';const svg=svgEl('svg',{class:'kicc-map-svg',viewBox:`0 0 ${width} ${height}`,preserveAspectRatio:'xMidYMid meet'});const edgeMap=new Map();for(const e of events){const a=pos.get(normalizeId(e.from)),b=pos.get(normalizeId(e.to));if(!a||!b)continue;const key=lineKey(e);if(!edgeMap.has(key)){const line=svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'kicc-link active','data-edge':key});svg.appendChild(line);edgeMap.set(key,{line,a,b});}}
  for(const n of nodes){const p=pos.get(n.id);if(!p)continue;const g=svgEl('g',{class:'kicc-node',transform:`translate(${p.x-64},${p.y-25})`});g.appendChild(svgEl('rect',{width:128,height:50}));const ico=svgEl('text',{x:9,y:21,class:'ico'});ico.textContent=iconFor(n);g.appendChild(ico);const t=svgEl('text',{x:31,y:18});t.textContent=(n.label||n.id).slice(0,18);g.appendChild(t);const m=svgEl('text',{x:31,y:35,class:'meta'});m.textContent=(n.meta||n.kind).slice(0,22);g.appendChild(m);svg.appendChild(g);}
  host.appendChild(svg);
  const legend=document.createElement('div');legend.className='kicc-map-legend';legend.innerHTML='<span><i style="background:#22c55e"></i>OK-Datenfluss</span><span><i style="background:#3b82f6"></i>Telemetrie</span><span><i style="background:#f59e0b"></i>Warnung</span><span><i style="background:#ef4444"></i>Fehler</span>';host.appendChild(legend);
  const badge=document.createElement('div');badge.className=`kicc-live-badge ${events.length?'':'none'}`;badge.innerHTML=events.length?`<strong>LIVE</strong> · ${events.length} beobachtete Events / 45 s`:'<strong>KEIN VERKEHR</strong> · keine beobachteten Events / 45 s';host.appendChild(badge);
  for(const e of events){const key=eventKey(e);if(renderedEvents.has(key))continue;renderedEvents.add(key);const edge=edgeMap.get(lineKey(e));if(edge)spawnParticle(svg,edge.a,edge.b,e);}
  if(renderedEvents.size>1000)renderedEvents.clear();
}
function spawnParticle(svg,a,b,e){const c=svgEl('circle',{r:5,cx:a.x,cy:a.y,fill:statusColor(e),class:'kicc-particle'});c.style.color=statusColor(e);svg.appendChild(c);const started=performance.now();function tick(now){const p=Math.min(1,(now-started)/PARTICLE_TTL_MS);c.setAttribute('cx',a.x+(b.x-a.x)*p);c.setAttribute('cy',a.y+(b.y-a.y)*p);c.setAttribute('opacity',p<.85?1:Math.max(0,(1-p)/.15));if(p<1&&c.isConnected)requestAnimationFrame(tick);else c.remove();}requestAnimationFrame(tick);c.setAttribute('aria-label',`${statusLabel(e)} ${normalizeId(e.from)} nach ${normalizeId(e.to)}`);}
function start(){render();globalThis.addEventListener('kicc:program-flow-ingested',render);globalThis.addEventListener('resize',render);setInterval(render,5_000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
globalThis.KICC_LIVE_TOPOLOGY={render};
