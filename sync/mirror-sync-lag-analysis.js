export const MSL_THRESHOLDS=Object.freeze({EXCELLENT:5,NORMAL:15,DELAYED:60,CRITICAL:300});
const HISTORY_KEY='kicc.mirror.syncLag.history.v1';
const MAX_POINTS=60;
const CLEAR_REQUIRED=3;
const nowIso=()=>new Date().toISOString();

function readHistory(){try{const raw=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(raw)?raw.filter(x=>Number.isFinite(x?.valueSec)&&Number.isFinite(new Date(x?.at).getTime())).slice(-MAX_POINTS):[];}catch{return[];}}
function writeHistory(list){try{localStorage.setItem(HISTORY_KEY,JSON.stringify(list.slice(-MAX_POINTS)));}catch{}}
export function recordSyncLag(valueSec,at=nowIso()){if(!Number.isFinite(valueSec)||valueSec<0)return readHistory();const list=readHistory();const last=list.at(-1);if(last&&Math.abs(new Date(at).getTime()-new Date(last.at).getTime())<30000){last.valueSec=valueSec;last.at=at;}else list.push({at,valueSec});writeHistory(list);return list.slice(-MAX_POINTS);}
export function syncLagHistory(){return readHistory();}
export function classifySyncLag(valueSec){if(!Number.isFinite(valueSec))return{level:'UNKNOWN',label:'Keine Messung',color:'GREY',recommendation:'Auf autoritative Mirror-Messung warten'};if(valueSec<=MSL_THRESHOLDS.EXCELLENT)return{level:'EXCELLENT',label:'Sehr gut',color:'GREEN',recommendation:'Kein Eingriff nötig'};if(valueSec<=MSL_THRESHOLDS.NORMAL)return{level:'NORMAL',label:'Normal',color:'GREEN',recommendation:'Kein Eingriff nötig'};if(valueSec<=MSL_THRESHOLDS.DELAYED)return{level:'DELAYED',label:'Verzögert',color:'YELLOW',recommendation:'Beobachten'};if(valueSec<=MSL_THRESHOLDS.CRITICAL)return{level:'CRITICAL',label:'Kritisch',color:'ORANGE',recommendation:'Mirror prüfen'};return{level:'SEVERE',label:'Sehr kritisch',color:'RED',recommendation:'Mirror und Datenfluss sofort prüfen'};}
function recoveryState(values,currentSec){if(!Number.isFinite(currentSec)||currentSec>MSL_THRESHOLDS.NORMAL)return{active:false,clearCount:0,clearRequired:CLEAR_REQUIRED};const tail=values.slice(-CLEAR_REQUIRED);let clearCount=0;for(let i=tail.length-1;i>=0;i--){if(tail[i]<=MSL_THRESHOLDS.NORMAL)clearCount++;else break;}const priorWasDelayed=values.slice(0,-clearCount).some(v=>v>MSL_THRESHOLDS.NORMAL);return{active:priorWasDelayed&&clearCount<CLEAR_REQUIRED,clearCount,clearRequired:CLEAR_REQUIRED};}
export function analyzeSyncLag(currentSec,history=readHistory()){
  const points=history.filter(x=>Number.isFinite(x.valueSec));
  const values=points.map(x=>x.valueSec);
  const avg1h=values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
  const max1h=values.length?Math.max(...values):null;
  let trend='—',trendCode='FLAT';
  if(values.length>=4){const recent=values.slice(-3).reduce((a,b)=>a+b,0)/Math.min(3,values.length);const previous=values.slice(-6,-3);const prior=previous.length?previous.reduce((a,b)=>a+b,0)/previous.length:values[0];const diff=recent-prior;if(diff>2){trend='↑ steigend';trendCode='UP';}else if(diff<-2){trend='↓ fallend';trendCode='DOWN';}else{trend='→ stabil';trendCode='FLAT';}}
  let rating=classifySyncLag(currentSec);
  const recovery=recoveryState(values,currentSec);
  if(recovery.active){rating={level:'RECOVERING',label:'Entwarnung läuft',color:'YELLOW',recommendation:`Noch ${recovery.clearRequired-recovery.clearCount} stabile Messung(en) ≤ 15 s abwarten`};}
  return{currentSec:Number.isFinite(currentSec)?currentSec:null,avg1h,max1h,trend,trendCode,sampleCount:values.length,recovery,...rating};
}
globalThis.KICC_MSL={record:recordSyncLag,history:syncLagHistory,classify:classifySyncLag,analyze:analyzeSyncLag,thresholds:MSL_THRESHOLDS,clearRequired:CLEAR_REQUIRED};
