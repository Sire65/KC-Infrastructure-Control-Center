export const MIRROR_STATES=['UNKNOWN','HEALTHY','DEGRADED','FAILED','RESYNC_REQUIRED'];

export function createMirrorFlow({id,sourceId,targetId,name,requiredForFailover=false,maxAgeMs=120000}){
  return {id,type:'FLOW',sourceId,targetId,name,requiredForFailover,maxAgeMs,status:'UNKNOWN',measuredAt:null,lastSuccessAt:null,runCount24h:null,errorCount24h:null,mismatchCount24h:null,syncLagSec:null,queueDepth:null,conflictCount:null,trust:'UNVERIFIED',message:'Noch keine Mirror-Telemetrie empfangen.'};
}

export function evaluateMirrorHealth(flow,now=Date.now()){
  if(!flow?.measuredAt)return{status:'UNKNOWN',readyForFailover:false,reason:'Keine aktuelle Mirror-Messung'};
  const age=now-new Date(flow.measuredAt).getTime();
  if(!Number.isFinite(age)||age>flow.maxAgeMs)return{status:'UNKNOWN',readyForFailover:false,reason:'Mirror-Messung veraltet'};
  if((flow.mismatchCount24h??0)>0||(flow.conflictCount??0)>0)return{status:'FAILED',readyForFailover:false,reason:'Datenabweichung oder Konflikt erkannt'};
  const errors=flow.errorCount24h??0,runs=flow.runCount24h??0,errorRate=runs>0?errors/runs:0;
  const lag=flow.syncLagSec;
  if(Number.isFinite(lag)&&lag>300)return{status:'DEGRADED',readyForFailover:false,reason:'Sync-Lag über 5 Minuten'};
  if(errorRate>0.01)return{status:'DEGRADED',readyForFailover:false,reason:'Mirror-Fehlerquote über 1 %'};
  if(!flow.lastSuccessAt)return{status:'UNKNOWN',readyForFailover:false,reason:'Kein letzter erfolgreicher Abgleich'};
  return{status:'HEALTHY',readyForFailover:true,reason:'Aktuell, ohne Mismatch/Konflikt, Fehlerquote im Grenzwert',errorRate};
}

export function applyMirrorObservation(flow,observation={}){
  const allowed=['status','measuredAt','lastSuccessAt','runCount24h','errorCount24h','mismatchCount24h','syncLagSec','queueDepth','conflictCount','trust','message'];
  for(const key of allowed)if(Object.prototype.hasOwnProperty.call(observation,key))flow[key]=observation[key];
  const evaluated=evaluateMirrorHealth(flow);
  flow.status=evaluated.status;
  flow.readyForFailover=evaluated.readyForFailover;
  flow.healthReason=evaluated.reason;
  return flow;
}
