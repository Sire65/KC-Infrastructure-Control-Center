export const GIT_BRIDGE_SCHEMA='kicc.git.bridge.v1';

export const GIT_BRIDGE_CAPABILITIES=Object.freeze([
  'repository.read','repository.download','repository.upload','repository.copy','repository.move','repository.delete','repository.mkdir'
]);

export const GIT_BRIDGE_STATES=Object.freeze([
  'NOT_CONFIGURED','AUTH_REQUIRED','READY','DEGRADED','OFFLINE'
]);

export const GIT_BRIDGE_INVARIANTS=Object.freeze([
  'Keine GitHub-Tokens, PATs, OAuth-Refresh-Tokens oder Repository-Secrets im Browser, Repository oder Service Worker.',
  'Schreibende Aktionen werden server-/agentseitig ausgeführt und niemals direkt aus Browser-JavaScript mit GitHub-Secrets.',
  'Jede Schreibaktion benötigt capability, Ziel-Repository, Branch, Pfad, Vorschau, Recovery-Punkt, explizite Freigabe, Verifikation und Audit-Journal.',
  'MOVE wird technisch als COPY + VERIFY + DELETE ausgeführt; DELETE erst nach erfolgreicher Zielverifikation.',
  'Bestehende Dateien werden ohne bekannte aktuelle SHA/ETag und Konfliktprüfung nicht überschrieben.',
  'KC, NON_KC und PRIVATE bleiben getrennte Domains; domainübergreifende Transfers sind explizit als solche zu kennzeichnen.',
  'Der Bridge-Kanal transportiert keine fachlichen Daten außer dem explizit übertragenen Dateiinhalt und notwendigen Metadaten.'
]);

export function validateBridgeStatus(payload,now=Date.now()){
  if(!payload||typeof payload!=='object')return{ok:false,state:'NOT_CONFIGURED',issues:['Bridge-Status fehlt']};
  const issues=[];
  if(payload.schema!==GIT_BRIDGE_SCHEMA)issues.push('Schema unbekannt');
  if(!GIT_BRIDGE_STATES.includes(payload.state))issues.push('Bridge-State ungültig');
  if(payload.state==='READY'&&payload.authenticated!==true)issues.push('READY ohne bestätigte Authentifizierung');
  if(payload.state==='READY'&&payload.trust!=='OBSERVED_BRIDGE')issues.push('READY ohne OBSERVED_BRIDGE');
  const measured=Date.parse(payload.measuredAt||'');
  if(!Number.isFinite(measured))issues.push('measuredAt fehlt/ungültig');
  const fresh=Number.isFinite(measured)&&now-measured<=5*60*1000;
  if(payload.state==='READY'&&!fresh)issues.push('Bridge-Messung veraltet');
  const caps=Array.isArray(payload.capabilities)?payload.capabilities:[];
  const unknownCaps=caps.filter(x=>!GIT_BRIDGE_CAPABILITIES.includes(x));
  if(unknownCaps.length)issues.push(`Unbekannte Capabilities: ${unknownCaps.join(', ')}`);
  return{ok:issues.length===0,state:issues.length?'DEGRADED':payload.state,fresh,issues,capabilities:caps};
}

export function bridgeTemplate(){
  return {schema:GIT_BRIDGE_SCHEMA,state:'NOT_CONFIGURED',authenticated:false,trust:'UNVERIFIED',measuredAt:null,collectorId:null,capabilities:['repository.read','repository.download'],endpoint:null};
}
