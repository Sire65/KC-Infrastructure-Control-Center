export const DOMAIN={KC:'KC',PRIVATE:'PRIVATE'};

export function markDomain(resource,domain=DOMAIN.KC){
  resource.domain=domain;
  return resource;
}

export function isKC(resource){return (resource?.domain||DOMAIN.KC)===DOMAIN.KC;}
export function isPrivate(resource){return resource?.domain===DOMAIN.PRIVATE;}

export function scopeSummary(resources=[]){
  return {
    kc:resources.filter(isKC).length,
    private:resources.filter(isPrivate).length
  };
}
