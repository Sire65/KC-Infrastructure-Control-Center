export const AUDIT_SCHEMA='kicc.git.audit.v1';

export function validateAuditEvent(event){
  const issues=[];
  if(event?.schema!==AUDIT_SCHEMA)issues.push('Schema ungültig');
  if(!event?.requestId)issues.push('requestId fehlt');
  if(!event?.at||!Number.isFinite(Date.parse(event.at)))issues.push('Zeitstempel fehlt/ungültig');
  if(!event?.subject)issues.push('subject fehlt');
  if(!event?.action)issues.push('action fehlt');
  if(!event?.result)issues.push('result fehlt');
  return{ok:issues.length===0,issues};
}

export function makeAuditRecord(event,{previousHash=null,eventHash=null}={}){
  const v=validateAuditEvent(event);if(!v.ok)throw new Error(v.issues.join(' · '));
  return {event,previousHash,eventHash,appendOnly:true,persistedAt:new Date().toISOString()};
}

export const AUDIT_PERSISTENCE_INVARIANTS=Object.freeze([
  'Audit ist append-only; vorhandene Einträge werden nicht überschrieben oder gelöscht.',
  'Secrets, Tokens und Dateiinhalte gehören nicht in das Audit.',
  'Jeder Transfer protokolliert STARTED und abschließend COMPLETED oder FAILED.',
  'Für destruktive Aktionen werden Recovery-Punkt und approvalId referenziert.',
  'Manipulationserkennung kann über previousHash/eventHash verkettet werden.'
]);
