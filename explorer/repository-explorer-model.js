export const EXPLORER_CAPABILITIES=Object.freeze({
  READ:'repository.read',
  DOWNLOAD:'repository.download',
  UPLOAD:'repository.upload',
  COPY:'repository.copy',
  MOVE:'repository.move',
  DELETE:'repository.delete'
});

export const EXPLORER_INVARIANTS=Object.freeze([
  'Lesen und Download sind von schreibenden Aktionen getrennt.',
  'Keine GitHub-Tokens, PATs oder Secrets im Browser, Repository oder Service Worker.',
  'Private Repositories werden nur über einen authentifizierten Server-/Agent-Bridge-Kanal gelesen.',
  'Upload, Kopieren, Verschieben und Löschen benötigen Capability, Vorschau, Freigabe und Journal.',
  'Keine schreibende Aktion ohne bekannten Ziel-Repository-/Branch-/Pfad-Kontext.',
  'KC, NON_KC und PRIVATE bleiben im Explorer als getrennte Domains sichtbar.'
]);

export function makeExplorerRepository({id,name,owner='Sire65',repo=null,domain='KC',visibility='UNKNOWN',source='REGISTRY'}={}){
  return {
    id:id||`${domain.toLowerCase()}-${repo||name}`,
    type:'EXPLORER_REPOSITORY',name:name||repo||'Unbenannt',owner,repo,domain,visibility,source,
    status:repo?'REGISTERED':'NO_REPOSITORY',defaultBranch:null,lastLoadedAt:null,trust:'UNVERIFIED'
  };
}

export function canBrowseDirect(repo){
  return Boolean(repo?.repo)&&String(repo.visibility||'UNKNOWN').toUpperCase()==='PUBLIC';
}

export function downloadUrl(repo,path,ref='main'){
  if(!canBrowseDirect(repo)||!path)return null;
  return `https://raw.githubusercontent.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/${encodeURIComponent(ref)}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export function writeActionPreview({kind,source,target,branch='main',path=null}={}){
  const allowed=['UPLOAD','COPY','MOVE','DELETE'];
  if(!allowed.includes(kind))throw new Error('Unbekannte Explorer-Aktion');
  return {
    kind,status:'PREPARED_NOT_EXECUTED',source:source||null,target:target||null,branch,path,
    requires:['Capability','Recovery-/Rollback-Betrachtung','Explizite Freigabe','Audit-Journal'],
    executable:false,
    reason:'Schreibende Explorer-Aktionen sind vorbereitet, aber ohne sicheren Git-Bridge-Kanal bewusst deaktiviert.'
  };
}
