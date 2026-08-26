function applyVersionScopeCorrection(){
  const sec=globalThis.KICC_SECURITY;if(!sec?.flows)return;
  const legacy=sec.flows.find(x=>x.id==='secflow-kasse-local-storage');
  if(legacy){
    legacy.source='KC Marktkasse · Legacy-Root';
    legacy.productVariant='LEGACY_ROOT';
    legacy.notes='OBSERVED_CODE gilt ausschließlich für den älteren veröffentlichten Root-Stand shared/kc-resilience.js: Transaktionen/Outbox werden dort als JSON in localStorage geschrieben. Dieser Befund darf nicht auf die neuere Bilderkasse/MarktKasse-Suite übertragen werden.';
  }
  const gateway=sec.flows.find(x=>x.id==='secflow-kasse-failover-gateway');
  if(gateway){
    gateway.source='KC Marktkasse · Legacy-Root';
    gateway.productVariant='LEGACY_ROOT';
  }
  if(!sec.flows.some(x=>x.id==='secflow-bilderkasse-local-encrypted')){
    sec.flows.push({
      id:'secflow-bilderkasse-local-encrypted',type:'SECURITY_FLOW',
      source:'KC Bilderkasse / MarktKasse-Suite · Kandidat',target:'IndexedDB lokal',
      dataClass:'Umsätze / Offline-Puffer',transport:'LOCAL',payloadEncryption:'UNKNOWN',auth:'UNKNOWN',keySource:'UNKNOWN',
      lastVerifiedAt:null,trust:'UNVERIFIED',domain:'KC',productVariant:'SUITE_CANDIDATE',
      notes:'Der neuere Suite-Stand ist getrennt vom Legacy-Root importiert. Nutzerhinweis: vermutlich verschlüsselte IndexedDB. Konkreter IndexedDB-/AES-Code ist im derzeit direkt lesbaren Repo-Bestand noch nicht autoritativ verifiziert; deshalb UNKNOWN statt rot oder grün.'
    });
  }
  if(!sec.flows.some(x=>x.id==='secflow-suite-companion-manager')){
    sec.flows.push({
      id:'secflow-suite-companion-manager',type:'SECURITY_FLOW',
      source:'KC MarktKasse Suite · Device Companion',target:'Manager Companion',
      dataClass:'Kassenereignisse / Sync',transport:'HTTPS',payloadEncryption:'TLS_ONLY',auth:'ROTATING_DEVICE_CREDENTIAL',keySource:'DEVICE_SCOPED',
      lastVerifiedAt:'2026-08-24T00:00:00.000Z',trust:'VERIFIED_CODE',domain:'KC',productVariant:'SUITE_CANDIDATE',
      notes:'Suite-Backend dokumentiert echtes HTTPS, Prüfung des TLS-Peer-Fingerprints vor Verarbeitung, persistente Geräteidentität und Credential-Rotation. 68/68 Integrationstests waren im importierten Stand dokumentiert. Noch Entwicklungsprototyp, nicht produktiv mit pos/pc-manager verbunden.'
    });
  }
  sec.render?.();
}
applyVersionScopeCorrection();setTimeout(applyVersionScopeCorrection,0);
