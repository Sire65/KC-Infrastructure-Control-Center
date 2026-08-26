export const RUNTIME_ATTESTATION_SCHEMA='kicc.security.attestation.v1';

export const AUTHORITATIVE_ATTESTATION_CHANNELS=Object.freeze(['KICC_AGENT','SIGNED_APP_BRIDGE']);

export const RUNTIME_ATTESTATION_RULES=Object.freeze([
  'Attestationen enthalten keine fachlichen Daten, Secrets, Tokens oder Schlüsselmaterial.',
  'Eine App meldet nur Security-Metadaten ihres eigenen laufenden Builds.',
  'Build-/Release-Fingerprint ist Pflicht; ohne Fingerprint keine Zuordnung zu Evidence.',
  'storageEngine, payloadEncryption und keyVersion werden getrennt gemeldet.',
  'Runtime-Angaben dürfen Code-Evidence ergänzen, aber niemals widersprüchliche Befunde still überschreiben.',
  'Nur frische Attestationen über KICC_AGENT oder SIGNED_APP_BRIDGE mit verifizierter Authentizität können RUNTIME_VERIFIED werden.',
  'Eine bloße JavaScript-Selbstauskunft der App ist kein autoritativer Security-Nachweis.'
]);

export function validateRuntimeAttestation(input,now=Date.now()){
  if(!input||typeof input!=='object')return{ok:false,status:'INVALID',issues:['Attestation fehlt']};
  const issues=[];
  if(input.schema!==RUNTIME_ATTESTATION_SCHEMA)issues.push('Schema unbekannt');
  if(!input.productId)issues.push('productId fehlt');
  if(!input.variant)issues.push('variant fehlt');
  if(!input.buildFingerprint)issues.push('buildFingerprint fehlt');
  if(!input.measuredAt)issues.push('measuredAt fehlt');
  if(!input.storage?.engine)issues.push('storage.engine fehlt');
  if(!input.storage?.payloadEncryption)issues.push('storage.payloadEncryption fehlt');
  if(!AUTHORITATIVE_ATTESTATION_CHANNELS.includes(input.provenance?.channel))issues.push('Attestationskanal nicht autoritativ');
  if(input.provenance?.authenticated!==true)issues.push('Transportauthentizität nicht bestätigt');
  if(input.provenance?.evidenceVerified!==true)issues.push('Evidence-Signatur/Agent-Nachweis nicht bestätigt');
  const measured=Date.parse(input.measuredAt||'');
  if(!Number.isFinite(measured))issues.push('measuredAt ungültig');
  const ageMs=Number.isFinite(measured)?Math.max(0,now-measured):Infinity;
  const fresh=ageMs<=5*60*1000;
  if(!fresh)issues.push('Attestation veraltet');
  const forbidden=['secret','token','password','privateKey','keyMaterial','serviceRoleKey'];
  for(const key of forbidden)if(Object.prototype.hasOwnProperty.call(input,key))issues.push(`verbotenes Feld: ${key}`);
  return {ok:issues.length===0,status:issues.length?'INVALID':'VALID',fresh,ageMs,issues,authoritative:issues.length===0};
}

export function evaluateStorageProtection(attestation){
  const v=validateRuntimeAttestation(attestation);
  if(!v.ok)return{status:'UNKNOWN',reason:v.issues.join(' · ')};
  const engine=String(attestation.storage.engine||'UNKNOWN').toUpperCase();
  const enc=String(attestation.storage.payloadEncryption||'UNKNOWN').toUpperCase();
  if(['NONE','UNENCRYPTED','PLAINTEXT'].includes(enc))return{status:'INSECURE',reason:`${engine} ohne Payload-Verschlüsselung`};
  if(enc==='AES-256-GCM'&&engine==='INDEXEDDB')return{status:'SECURE',reason:'IndexedDB + AES-256-GCM durch frische autoritative Runtime-Attestation bestätigt'};
  return{status:'WARNING',reason:`Speicher=${engine}, Verschlüsselung=${enc}; Schutz nicht vollständig klassifiziert`};
}

export function makeRuntimeAttestationTemplate({productId,variant,buildFingerprint}={}){
  return {
    schema:RUNTIME_ATTESTATION_SCHEMA,
    productId:productId||null,
    variant:variant||null,
    buildFingerprint:buildFingerprint||null,
    version:null,
    measuredAt:new Date().toISOString(),
    trust:'UNVERIFIED',
    provenance:{channel:'UNKNOWN',authenticated:false,evidenceVerified:false,collectorId:null},
    storage:{engine:'UNKNOWN',payloadEncryption:'UNKNOWN',keyVersion:null,schemaVersion:null,recordFormatVersion:null},
    transport:{scheme:'UNKNOWN',auth:'UNKNOWN'},
    notes:null
  };
}
