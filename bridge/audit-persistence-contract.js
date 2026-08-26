import { validateAuditEvent, makeAuditRecord } from './audit-store-model.js';

export const AUDIT_STORE_SCHEMA='kicc.git.audit.store.v1';
export const AUDIT_STORE_INVARIANTS=Object.freeze([
  'Persistenz ist append-only und idempotent nach requestId + result + eventHash.',
  'Vorhandene Audit-Records werden weder überschrieben noch gelöscht.',
  'previousHash und eventHash bilden eine prüfbare Kette.',
  'Secrets, Tokens, Authorization-Header und Dateiinhalte werden vor Persistenz verworfen.',
  'Integritätsfehler blockieren READY_FOR_ACTIVATION.'
]);

export function sanitizeAuditEvent(event={}){
  const allowed=['schema','requestId','at','subject','action','repository','path','result','detail','recoveryRef','approvalId'];
  const clean={};for(const key of allowed)if(Object.prototype.hasOwnProperty.call(event,key))clean[key]=event[key];
  return clean;
}

export function buildPersistRequest(event,{previousHash=null,eventHash=null}={}){
  const clean=sanitizeAuditEvent(event);const v=validateAuditEvent(clean);if(!v.ok)throw new Error(v.issues.join(' · '));
  return {schema:AUDIT_STORE_SCHEMA,record:makeAuditRecord(clean,{previousHash,eventHash}),idempotencyKey:`${clean.requestId}:${clean.result}:${eventHash||'nohash'}`};
}

export function validateAuditChain(records=[]){
  const issues=[];let expectedPrevious=null;
  records.forEach((record,index)=>{
    if(!record?.appendOnly)issues.push(`Record ${index}: appendOnly fehlt`);
    if(index>0&&record.previousHash!==expectedPrevious)issues.push(`Record ${index}: previousHash passt nicht`);
    if(!record.eventHash)issues.push(`Record ${index}: eventHash fehlt`);
    expectedPrevious=record.eventHash||null;
  });
  return {ok:issues.length===0,count:records.length,headHash:expectedPrevious,issues};
}
