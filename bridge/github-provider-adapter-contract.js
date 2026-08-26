export const GITHUB_ADAPTER_SCHEMA='kicc.git.provider.github.v1';

export const GITHUB_PROVIDER_REQUIREMENTS=Object.freeze([
  'GitHub App oder gleichwertige kurzlebige Installation-Credentials; kein dauerhaftes PAT im Browser.',
  'Repository-Allowlist und minimale Permissions je Capability.',
  'Contents read für browse/download; Contents write nur für freigegebene Schreibaktionen.',
  'Aktuelle Blob-SHA vor Update/Delete prüfen; Konflikt bei Abweichung statt blindem Überschreiben.',
  'MOVE: Ziel schreiben, Ziel-SHA/Inhalt verifizieren, erst dann Quelle löschen.',
  'Download-Tickets kurzlebig und eng auf Repository/Ref/Pfad begrenzen.',
  'Rate-/Größenlimits und Audit müssen serverseitig erzwungen werden.'
]);

export function validateGithubProviderConfig(config={}){
  const issues=[];
  if(config.schema!==GITHUB_ADAPTER_SCHEMA)issues.push('Schema fehlt/ungültig');
  if(config.credentialMode!=='GITHUB_APP_INSTALLATION_TOKEN')issues.push('Credential-Modus muss kurzlebiges GitHub-App-Installationstoken sein');
  if(!Array.isArray(config.repositoryAllowlist)||!config.repositoryAllowlist.length)issues.push('Repository-Allowlist fehlt');
  if(config.secretsInBrowser===true)issues.push('Browser-Secrets sind verboten');
  if(config.verifyCurrentSha!==true)issues.push('SHA-Konfliktprüfung muss aktiv sein');
  if(config.auditEnabled!==true)issues.push('Audit muss aktiv sein');
  return {ok:issues.length===0,issues};
}

export function githubProviderTemplate(){
  return {
    schema:GITHUB_ADAPTER_SCHEMA,
    status:'PREPARED',
    credentialMode:'GITHUB_APP_INSTALLATION_TOKEN',
    repositoryAllowlist:[],
    secretsInBrowser:false,
    verifyCurrentSha:true,
    auditEnabled:true,
    maxUploadBytes:null,
    rateLimitPolicy:'NOT_CONFIGURED'
  };
}
