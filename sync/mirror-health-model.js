export const MIRROR_STATES=['UNKNOWN','HEALTHY','DEGRADED','FAILED','RESYNC_REQUIRED'];
export function createMirrorFlow({id,sourceId,targetId,name,requiredForFailover=false,maxAgeMs=120000}){return{id,type:'FLOW',sourceId,targetId,name,requiredForFailover,maxAgeMs,status:'UNKNOWN',measuredAt:null,lastSuccessAt:null,runCount24h:null,errorCount24h:null,mismatchCount24h:null,currentMismatchCount:null,syncLagSec:null,queueDepth:null,conflictCount:null,currentConflictCount:null,trust:'UNVERIFIED',message:'Noch keine Mirror-Telemetrie empfangen.'}}
export function evaluateMirrorHealth(flow,now=Date.now()){
 if(!flow?.measuredAt)return{status:'UNKNOWN',readyForFailover:false,reason:'Keine aktuelle Mirror-Messung'};
 const t=new Date(flow.measuredAt).getTime(),age=now-t;if(!Number.isFinite(t)||age< -15000||age>flow.maxAgeMs)return{status:'UNKNOWN',readyForFailover:false,reason:'Mirror-Messung veraltet oder Zeitstempel ungültig'};
 const currentMismatch=flow.currentMismatchCount,currentConflict=flow.currentConflictCount;
 if(Number.isFinite(currentMismatch)&&currentMismatch>0||Number.isFinite(currentConflict)&&currentConflict>0)return{status:'FAILED',readyForFailover:false,reason:'Aktuelle Datenabweichung oder Konflikt erkannt'};
 const explicit=String(flow.status||'').toUpperCase();if(['FAILED','RESYNC_REQUIRED'].includes(explicit))return{status:explicit,readyForFailover:false,reason:flow.message||'Aktueller Mirror-Lauf meldet einen Fehler'};
 const lag=Number(flow.syncLagSec);if(Number.isFinite(lag)&&lag>300)return{status:'DEGRADED',readyForFailover:false,reason:'Aktueller Sync-Lag über 5 Minuten'};
 if(!flow.lastSuccessAt)return{status:'UNKNOWN',readyForFailover:false,reason:'Kein letzter erfolgreicher Abgleich'};
 const successAge=now-new Date(flow.lastSuccessAt).getTime();if(!Number.isFinite(successAge)||successAge>Math.max(flow.maxAgeMs*2,300000))return{status:'DEGRADED',readyForFailover:false,reason:'Letzter erfolgreicher Abgleich zu alt'};
 return{status:'HEALTHY',readyForFailover:true,reason:'Aktueller Mirror-Zustand ohne nachgewiesene Abweichung/Konflikt'};
}
export function applyMirrorObservation(flow,observation={}){const allowed=['status','measuredAt','lastSuccessAt','runCount24h','errorCount24h','mismatchCount24h','currentMismatchCount','syncLagSec','queueDepth','conflictCount','currentConflictCount','trust','message'];for(const key of allowed)if(Object.prototype.hasOwnProperty.call(observation,key))flow[key]=observation[key];const evaluated=evaluateMirrorHealth(flow);flow.status=evaluated.status;flow.readyForFailover=evaluated.readyForFailover;flow.healthReason=evaluated.reason;return flow}
