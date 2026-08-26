import { createRegionMigration, migrationInvariants } from './region-migration-model.js';

const migrations=[
  createRegionMigration({id:'mig-supabase-core-de',resourceId:'db-supabase-core',provider:'Supabase',sourceRegion:'eu-west-2 · London',targetRegion:'eu-central-1 · Frankfurt',targetJurisdiction:'DE'}),
  createRegionMigration({id:'mig-neon-core-de',resourceId:'db-neon-core-mirror',provider:'Neon',sourceRegion:'aws-eu-west-2 · London',targetRegion:'aws-eu-central-1 · Frankfurt',targetJurisdiction:'DE'}),
  createRegionMigration({id:'mig-neon-backup-vault-de',resourceId:'db-neon-backup-vault',provider:'Neon',sourceRegion:'aws-us-west-2 · USA',targetRegion:'aws-eu-central-1 · Frankfurt',targetJurisdiction:'DE'}),
  createRegionMigration({id:'mig-b2-pc-eu',resourceId:'storage-b2-pc',provider:'Backblaze B2',sourceRegion:'US · aktuell zu verifizieren',targetRegion:'eu-central · Amsterdam',targetJurisdiction:'EU'})
];

const alreadyCompliant=[
  {resourceId:'db-supabase-futura',provider:'Supabase',region:'eu-central-1 · Frankfurt',jurisdiction:'DE',state:'COMPLIANT'}
];

function badgeClass(state){return state==='COMPLIANT'?'healthy':state==='BLOCKED'?'failed':'degraded';}
function render(){
  const host=document.getElementById('regionMigrationCards');
  if(!host)return;
  const planned=migrations.map(m=>`<article class="db-card"><div class="db-title"><span class="status-chip ${badgeClass(m.state)}"><span class="dot"></span>${m.state}</span><strong>${m.provider}</strong></div><div class="db-meta"><span>Quelle: ${m.sourceRegion}</span><span>Ziel: ${m.targetRegion}</span><span>Ziel-Rechtsraum: ${m.targetJurisdiction}</span><span>Ressource: ${m.resourceId}</span><span>Ausführung: NICHT GESTARTET</span></div><div class="caps"><span class="cap unknown">Recovery Point</span><span class="cap unknown">Kopie</span><span class="cap unknown">Delta-Sync</span><span class="cap unknown">Verifikation</span><span class="cap unknown">Cutover</span><span class="cap unknown">Rollback</span></div><div class="db-note">Nur vorbereitet. Keine Zielressource angelegt, keine Daten kopiert, kein Routing geändert und keine Quelle gelöscht.</div></article>`).join('');
  const compliant=alreadyCompliant.map(x=>`<article class="db-card"><div class="db-title"><span class="status-chip healthy"><span class="dot"></span>${x.state}</span><strong>${x.provider}</strong></div><div class="db-meta"><span>Region: ${x.region}</span><span>Rechtsraum: ${x.jurisdiction}</span><span>Ressource: ${x.resourceId}</span></div><div class="db-note">Bereits in der bevorzugten deutschen Region; kein Umzug erforderlich.</div></article>`).join('');
  host.innerHTML=planned+compliant;
}

window.KICC_REGION_MIGRATION={migrations,alreadyCompliant,invariants:migrationInvariants(),render};
render();
