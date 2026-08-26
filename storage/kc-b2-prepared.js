import { makeObjectStorageResource } from './object-storage-model.js';

export const preparedKcObjectStorage=[
  makeObjectStorageResource({
    id:'storage-b2-kc-backup',
    name:'Backblaze B2 · KC Backup · vorbereitet',
    provider:'Backblaze B2',
    role:'KC_BACKUP',
    scope:'eu-central · Amsterdam (planned)',
    domain:'KC',
    bucket:null,
    credentialRef:'secret://kicc/kc-b2-backup',
    retentionPolicy:'DEFINE_BEFORE_ACTIVATION',
    encryptionPolicy:'CLIENT_SIDE_ENCRYPTION_REQUIRED',
    restorePolicy:'PERIODIC_RESTORE_TEST_REQUIRED',
    adapterId:'telemetry-bridge',
    capabilities:['health','latency','capacity','usage','objectCount','upload','download','integrity','encryption','retention','restoreTest']
  }),
  makeObjectStorageResource({
    id:'storage-b2-kc-media',
    name:'Backblaze B2 · KC Media/Archiv · optional vorbereitet',
    provider:'Backblaze B2',
    role:'KC_ARCHIVE',
    scope:'eu-central · Amsterdam (planned)',
    domain:'KC',
    bucket:null,
    credentialRef:'secret://kicc/kc-b2-media',
    retentionPolicy:'DEFINE_BEFORE_ACTIVATION',
    encryptionPolicy:'ENCRYPTION_REQUIRED',
    restorePolicy:'RESTORE_TEST_BY_POLICY',
    adapterId:'telemetry-bridge',
    capabilities:['health','latency','capacity','usage','objectCount','upload','download','integrity','encryption','retention','restoreTest']
  })
];

export function kcB2PreparationChecklist(){
  return [
    'Separate KC bucket from PRIVATE PC Backup Vault bucket.',
    'Use separate KC application keys; never reuse PRIVATE credentials.',
    'Prefer EU region; Germany if Backblaze offers it in the future.',
    'Define data classes allowed in each bucket before activation.',
    'Require encryption, retention and restore-test policy before first productive upload.',
    'Do not count a prepared resource as healthy or available before authoritative telemetry exists.'
  ];
}

globalThis.KICC_PREPARED_KC_OBJECT_STORAGE={resources:preparedKcObjectStorage,checklist:kcB2PreparationChecklist()};
