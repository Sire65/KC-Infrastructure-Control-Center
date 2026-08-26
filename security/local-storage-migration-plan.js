export const LOCAL_SECURITY_MIGRATION={
  id:'migration-kasse-local-storage-encryption',
  productId:'kc-kasse',
  domain:'KC',
  status:'PREPARED',
  source:{technology:'localStorage',format:'JSON',encryption:'NONE',keys:['kc_transactions_v040','kc_sync_outbox_v1','kc_sync_ack_v1','kc_sync_conflicts_v1','kc_sync_status_v1']},
  target:{technology:'IndexedDB',encryption:'AES-256-GCM',keyModel:'PER_DEVICE_OR_DATASET_DEK_WRAPPED_BY_KEK',recordVersioning:true,authenticatedEncryption:true},
  mode:'PARALLEL_MIGRATION',
  destructive:false,
  autoCutover:false,
  autoDeleteLegacy:false,
  gates:[
    {id:'inventory',label:'Legacy-Datenbestand inventarisieren',required:true,status:'PENDING'},
    {id:'key-provisioning',label:'Geräte-/Datensatzschlüssel sicher bereitstellen',required:true,status:'PENDING'},
    {id:'encrypted-write',label:'Verschlüsseltes Schreiben nach IndexedDB testen',required:true,status:'PENDING'},
    {id:'roundtrip',label:'Encrypt/Decrypt-Roundtrip und Integrität prüfen',required:true,status:'PENDING'},
    {id:'dual-write',label:'Parallelbetrieb Legacy + verschlüsselt testen',required:true,status:'PENDING'},
    {id:'offline',label:'Offline-Betrieb vollständig testen',required:true,status:'PENDING'},
    {id:'sync',label:'Sync/Reconcile mit verschlüsseltem Store testen',required:true,status:'PENDING'},
    {id:'restore',label:'Restore aus verschlüsseltem Store testen',required:true,status:'PENDING'},
    {id:'rollback',label:'Rollback auf Legacy ohne Datenverlust testen',required:true,status:'PENDING'},
    {id:'parity',label:'Datensatzanzahl/IDs/Hashes zwischen Alt und Neu vergleichen',required:true,status:'PENDING'},
    {id:'release-security',label:'Security- und SUPER-GAU-Testprofil bestehen',required:true,status:'PENDING'},
    {id:'cutover-approval',label:'Explizite Cutover-Freigabe',required:true,status:'PENDING'},
    {id:'observation',label:'Beobachtungsphase nach Cutover bestehen',required:true,status:'PENDING'},
    {id:'legacy-delete-approval',label:'Separate Freigabe zum Löschen der Plaintext-Legacy-Daten',required:true,status:'PENDING'}
  ],
  invariants:[
    'Legacy-Daten werden vor erfolgreichem Cutover niemals automatisch gelöscht.',
    'Kein Schlüssel oder Recovery-Material wird im Repository, Service Worker oder als Klartext im Browser gespeichert.',
    'Jeder verschlüsselte Datensatz trägt Schema-/Key-Version und einen frischen 96-bit Nonce.',
    'AES-256-GCM Authentifizierung muss vor Nutzung des Klartexts erfolgreich sein.',
    'Cutover und spätere Legacy-Löschung sind zwei getrennte Freigaben.',
    'Bei jeder Paritätsabweichung wird die Migration blockiert und Legacy bleibt authoritative.'
  ]
};

export function migrationProgress(plan=LOCAL_SECURITY_MIGRATION){
  const required=plan.gates.filter(g=>g.required);
  const done=required.filter(g=>g.status==='DONE').length;
  return {done,total:required.length,percent:required.length?Math.round(done/required.length*100):0,ready:required.length>0&&done===required.length};
}

export function migrationBlockers(plan=LOCAL_SECURITY_MIGRATION){
  return plan.gates.filter(g=>g.required&&g.status!=='DONE').map(g=>g.label);
}

export function setMigrationGate(id,status){
  if(!['PENDING','RUNNING','DONE','FAILED','BLOCKED'].includes(status))throw new Error('Invalid migration gate status');
  const gate=LOCAL_SECURITY_MIGRATION.gates.find(g=>g.id===id);
  if(!gate)throw new Error('Unknown migration gate');
  gate.status=status;
  return gate;
}
