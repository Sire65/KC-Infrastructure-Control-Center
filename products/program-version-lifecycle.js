const STORE_KEY='kicc.program-version-lifecycle.v1';
const FRESH_MS=120000;
const states=new Map();

function clean(v){return typeof v==='string'&&v.trim()?v.trim():null;}
function parts(v){const s=clean(v);if(!s)return null;const m=s.match(/(?:^|[^0-9])(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[.\-+ ]?(\d+))?/);if(!m)return null;return m.slice(1).map(x=>Number(x||0));}
function cmp(a,b){const A=parts(a),B=parts(b);if(!A||!B)return clean(a)===clean(b)?0:null;for(let i=0;i<Math.max(A.length,B.length);i++){const d=(A[i]||0)-(B[i]||0);if(d)return d>0?1:-1;}return 0;}
function fresh(ts){const t=ts?new Date(ts).getTime():0;return Number.isFinite(t)&&Date.now()-t<=FRESH_MS;}
function load(){try{return JSON.parse(localStorage.getItem(STORE_KEY)||'{}')||{};}catch{return{};}}
function save(obj){try{localStorage.setItem(STORE_KEY,JSON.stringify(obj));}catch{}}
function devicesFor(id){try{return (globalThis.KICC_DEVICES?.list?.()||[]).filter(x=>x.programId===id&&fresh(x.measuredAt));}catch{return[];}}
function sourceStage(p){if(p.sourceState==='SOURCE_REQUIRED')return'SOURCE_REQUIRED';if(p.sourceState==='RESTORE_PREPARED')return'RESTORE_PREPARED';if(p.sourceState==='SOURCE_READY')return'SOURCE_READY';if(p.gitVersion||p.versionSource)return'SOURCE_READY';if(p.repositoryState==='REGISTERED')return'DISCOVERED';return'UNKNOWN';}
function lifecycle(p){
 const ds=devicesFor(p.id),runtimeVersions=[...new Set(ds.map(x=>clean(x.version)).filter(Boolean))];
 const runtimeVersion=runtimeVersions.length===1?runtimeVersions[0]:runtimeVersions.length?runtimeVersions.join(' / '):clean(p.runtimeVersion);
 const gitVersion=clean(p.gitVersion);
 const deploymentVersion=clean(p.deploymentVersion);
 let stage=sourceStage(p);
 if(p.buildVerifiedAt)stage='BUILD_VERIFIED';
 if(p.deploymentHealth==='HEALTHY'&&p.deploymentUrl)stage='DEPLOYED';
 if(ds.length&&ds.some(x=>fresh(x.measuredAt)))stage='RUNTIME_VERIFIED';
 let updateStatus='UNKNOWN';
 if(gitVersion&&runtimeVersions.length){const cs=runtimeVersions.map(v=>cmp(gitVersion,v));if(cs.every(x=>x===0))updateStatus='CURRENT';else if(cs.some(x=>x===1))updateStatus='UPDATE_AVAILABLE';else if(cs.every(x=>x===-1))updateStatus='RUNTIME_AHEAD';else updateStatus='MIXED_RUNTIME';}
 else if(gitVersion&&!runtimeVersions.length)updateStatus='RUNTIME_NOT_VERIFIED';
 const outdated=gitVersion?ds.filter(d=>cmp(gitVersion,d.version)===1):[];
 return {productId:p.id,gitVersion,deploymentVersion,runtimeVersion,runtimeVersions,stage,updateStatus,outdatedInstances:outdated.map(d=>({deviceId:d.deviceId,name:d.name||d.deviceId,version:d.version,measuredAt:d.measuredAt})),measuredAt:new Date().toISOString()};
}
function refresh(){
 const products=globalThis.KICC_PROGRAMS?.programs||[],persist=load();
 for(const p of products){const s=lifecycle(p),old=persist[p.id]||{};if(s.gitVersion&&old.gitVersion&&s.gitVersion!==old.gitVersion){s.gitChangedAt=new Date().toISOString();globalThis.dispatchEvent(new CustomEvent('kicc:program-version-change',{detail:{productId:p.id,oldVersion:old.gitVersion,newVersion:s.gitVersion,measuredAt:s.gitChangedAt}}));}else s.gitChangedAt=old.gitChangedAt||null;states.set(p.id,s);Object.assign(p,{runtimeVersion:s.runtimeVersion,runtimeVersions:s.runtimeVersions,versionLifecycle:s});persist[p.id]={gitVersion:s.gitVersion,gitChangedAt:s.gitChangedAt,lastSeenAt:s.measuredAt};}
 save(persist);globalThis.dispatchEvent(new CustomEvent('kicc:program-version-lifecycle',{detail:{measuredAt:new Date().toISOString()}}));return [...states.values()];
}
function badge(s){return ({CURRENT:'AKTUELL',UPDATE_AVAILABLE:'UPDATE VERFÜGBAR',MIXED_RUNTIME:'VERSIONSMIX',RUNTIME_AHEAD:'RUNTIME VORAUS',RUNTIME_NOT_VERIFIED:'RUNTIME OFFEN',UNKNOWN:'UNBEKANNT'})[s]||s;}
function summary(id){return states.get(id)||null;}
addEventListener('kicc:github-telemetry',refresh);addEventListener('kicc:program-heartbeat-ingested',()=>setTimeout(refresh,0));setInterval(refresh,30000);queueMicrotask(()=>setTimeout(refresh,300));
globalThis.KICC_VERSION_LIFECYCLE={refresh,summary,list:()=>[...states.values()],badge,compare:cmp};
