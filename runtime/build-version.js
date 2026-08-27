const VERSION='0.1.0-dev.83';
globalThis.KICC_BUILD_VERSION=VERSION;
queueMicrotask(()=>{
  if(globalThis.KICC)globalThis.KICC.version=VERSION;
  const el=document.getElementById('version');if(el)el.textContent=VERSION;
});
