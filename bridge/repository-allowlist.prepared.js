import { makeRepositoryPolicy } from './repository-allowlist.js';

// Vorbereitete Kandidatenliste. Nicht produktiv aktiviert und kein Ersatz für eine verifizierte Bridge-Konfiguration.
export const PREPARED_REPOSITORY_ALLOWLIST=Object.freeze([
  makeRepositoryPolicy({owner:'Sire65',repo:'Kasse',domain:'KC',read:true,download:true,write:false}),
  makeRepositoryPolicy({owner:'Sire65',repo:'dp3',domain:'KC',read:true,download:true,write:false}),
  makeRepositoryPolicy({owner:'Sire65',repo:'Dienstplan',domain:'KC',read:true,download:true,write:false}),
  makeRepositoryPolicy({owner:'Sire65',repo:'KC-Bilderrechner',domain:'KC',read:true,download:true,write:false}),
  makeRepositoryPolicy({owner:'Sire65',repo:'KC-Futura-Academy',domain:'KC',read:true,download:true,write:false}),
  makeRepositoryPolicy({owner:'Sire65',repo:'KC-Communication',domain:'KC',read:true,download:true,write:false}),
  makeRepositoryPolicy({owner:'Sire65',repo:'KC-Communication-Public',domain:'KC',read:true,download:true,write:false}),
  makeRepositoryPolicy({owner:'Sire65',repo:'KC-Failover-Gateway',domain:'KC',read:true,download:true,write:false}),
  makeRepositoryPolicy({owner:'Sire65',repo:'KC-Werbewebsite',domain:'KC',read:true,download:true,write:false}),
  makeRepositoryPolicy({owner:'Sire65',repo:'KC-Kuechen-Detektiv',domain:'KC',read:true,download:true,write:false}),
  makeRepositoryPolicy({owner:'Sire65',repo:'KC-Infrastructure-Control-Center',domain:'KC',read:true,download:true,write:false})
]);

export const PREPARED_ALLOWLIST_STATE='PREPARED_NOT_ACTIVATED';
