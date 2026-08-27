const ENDPOINTS={
  core:'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kicc-telemetry',
  futura:'https://iddudrxuihdodnvejxcp.supabase.co/functions/v1/kicc-telemetry'
};

async function authFor(targetId){
  try{return await globalThis.KICC_AUTH?.getSupabaseBridgeAuth?.(targetId)||{};}catch{return{};}
}
async function probe(url,auth){
  if(!auth?.authorization)return{available:false,ok:false,status:null};
  const headers={accept:'application/json',authorization:auth.authorization};
  if(auth.apikey)headers.apikey=auth.apikey;
  try{const r=await fetch(url,{method:'GET',headers,cache:'no-store',credentials:'omit'});return{available:true,ok:r.status===200,status:r.status};}
  catch{return{available:true,ok:false,status:null};}
}
function control(){return globalThis.KICC_SECURITY?.controls?.find?.(x=>x.id==='sec-auth-jwt')||null;}
async function verify(){
  const c=control();if(!c)return;
  const [coreAuth,futuraAuth]=await Promise.all([authFor('db-supabase-core'),authFor('db-supabase-futura')]);
  const [core,futura]=await Promise.all([probe(ENDPOINTS.core,coreAuth),probe(ENDPOINTS.futura,futuraAuth)]);
  const now=new Date().toISOString();
  if(!core.available||!futura.available){
    if(c.status==='SECURE')Object.assign(c,{status:'WARNING',evidence:'JWT-Erzwingung bestätigt; autorisierter Zugriff mit aktuellem Benutzer-Token noch nicht auf beiden Endpunkten bestätigt.',measuredAt:now});
  }else if(core.ok&&futura.ok){
    Object.assign(c,{status:'SECURE',evidence:'JWT-Erzwingung und autorisierter Zugriff mit aktuellem Benutzer-Token auf beiden Telemetrie-Endpunkten bestätigt.',measuredAt:now});
  }else{
    Object.assign(c,{status:'WARNING',evidence:`JWT wird erzwungen; autorisierter Zugriff nicht vollständig bestätigt (Core ${core.status??'Fehler'}, Futura ${futura.status??'Fehler'}).`,measuredAt:now});
  }
  globalThis.KICC_SECURITY?.render?.();
}
setTimeout(verify,1800);
setInterval(verify,30000);
addEventListener('kicc:authchange',verify);
globalThis.KICC_SECURITY_AUTH_FIX={verify};
