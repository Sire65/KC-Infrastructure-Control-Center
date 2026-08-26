import { makeDatabaseResource } from '../database/database-model.js';

const kicc=globalThis.KICC;
if(kicc?.databases&&!kicc.databases.some(x=>x.id==='db-neon-backup-vault')){
  kicc.databases.push(makeDatabaseResource({
    id:'db-neon-backup-vault',
    name:'Neon · PC Backup Vault · USA West',
    provider:'Neon',
    role:'BACKUP_METADATA',
    scope:'aws-us-west-2',
    adapterId:'telemetry-bridge',
    capabilities:['health','latency','reads','writes','storage','schema','integrity','backup','restore','migration']
  }));
  kicc.runDiscovery?.();
}
