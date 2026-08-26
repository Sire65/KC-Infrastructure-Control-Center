function applyVersionScopeCorrection(){
  const sec=globalThis.KICC_SECURITY;if(!sec?.flows)return;
  const legacy=sec.flows.find(x=>x.id==='secflow-kasse-local-storage');
  if(legacy){
    legacy.source='KC Marktkasse · Legacy-Root';
    legacy.notes='Beleg gilt ausschließlich für den älteren veröffentlichten Root-Stand shared/kc-resilience.js. Nicht auf die neuere Bilderkasse/Suite übertragen.';
  }
  if(!sec.flows.some(x=>x.id==='secflow-bilderkasse-local-encrypted')){
    sec.flows.push({
      id:'secflow-bilderkasse-local-encrypted',type:'SECURITY_FLOW',
      source:'KC Bilderkasse · neuerer Suite-Kandidat',target:'IndexedDB lokal',
      dataClass:'Umsätze / Offline-Puffer',transport:'LOCAL',payloadEncryption:'UNKNOWN',auth:'LOCAL_SESSION',keySource:'UNKNOWN',
      lastVerifiedAt:null,trust:'UNVERIFIED',domain:'KC',
      notes:'Hinweis auf neueren Stand vorhanden. Verschlüsseltes IndexedDB wird erst nach Code-/Runtime-Nachweis als AES-256-GCM bestätigt.'
    });
  }
  sec.render?.();
}
applyVersionScopeCorrection();setTimeout(applyVersionScopeCorrection,0);
