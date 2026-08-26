export const BRIDGE_ROLES=Object.freeze({
  VIEWER:['repository.read','repository.download'],
  OPERATOR:['repository.read','repository.download','repository.upload','repository.copy','repository.mkdir'],
  ADMIN:['repository.read','repository.download','repository.upload','repository.copy','repository.move','repository.delete','repository.mkdir']
});

export function capabilitiesForRoles(roles=[]){
  return [...new Set(roles.flatMap(role=>BRIDGE_ROLES[role]||[]))];
}

export function authorizeCapability({roles=[],capability}={}){
  const capabilities=capabilitiesForRoles(roles);
  return {allowed:capabilities.includes(capability),capabilities};
}
