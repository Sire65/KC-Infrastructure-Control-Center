export const DOMAIN={KC:'KC',PRIVATE:'PRIVATE',NON_KC:'NON_KC'};

export function markDomain(resource,domain=DOMAIN.KC){
  resource.domain=domain;
  return resource;
}

export function isKC(resource){return (resource?.domain||DOMAIN.KC)===DOMAIN.KC;}
export function isPrivate(resource){return resource?.domain===DOMAIN.PRIVATE;}
export function isNonKC(resource){return resource?.domain===DOMAIN.NON_KC;}

export function scopeSummary(resources=[]){
  return {
    kc:resources.filter(isKC).length,
    private:resources.filter(isPrivate).length,
    nonKc:resources.filter(isNonKC).length
  };
}
