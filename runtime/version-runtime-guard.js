function apply(){
  const version=globalThis.KICC_BUILD_VERSION;if(!version)return;
  if(globalThis.KICC&&globalThis.KICC.version!==version)globalThis.KICC.version=version;
  const el=document.getElementById('version');if(el&&el.textContent!==version)el.textContent=version;
}
setTimeout(apply,0);setTimeout(apply,250);setInterval(apply,5000);
globalThis.addEventListener('kicc:tabchange',apply);
globalThis.KICC_VERSION_GUARD={apply,current:()=>globalThis.KICC_BUILD_VERSION||null};
