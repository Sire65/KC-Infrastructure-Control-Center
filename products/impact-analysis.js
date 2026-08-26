export function impactedProducts(programs=[],resourceId){
  if(!resourceId)return[];
  return programs.filter(p=>{
    const d=p.dependencies||{};
    return ['databases','communication','failover','storage'].some(group=>(d[group]||[]).includes(resourceId));
  }).map(p=>({id:p.id,name:p.name,kind:p.kind,critical:Boolean(p.critical)}));
}

export function buildImpactMatrix(programs=[]){
  const map=new Map();
  for(const p of programs){
    const d=p.dependencies||{};
    for(const group of ['databases','communication','failover','storage']){
      for(const resourceId of d[group]||[]){
        if(!map.has(resourceId))map.set(resourceId,[]);
        map.get(resourceId).push({productId:p.id,name:p.name,critical:Boolean(p.critical),dependencyType:group});
      }
    }
  }
  return [...map.entries()].map(([resourceId,products])=>({resourceId,products,criticalProducts:products.filter(x=>x.critical).length}));
}

export function summarizeImpact(programs=[],resourceId){
  const products=impactedProducts(programs,resourceId);
  return {resourceId,count:products.length,criticalCount:products.filter(x=>x.critical).length,products};
}
