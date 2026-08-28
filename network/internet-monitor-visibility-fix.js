function resizeInternetCharts(){
  const root=document.getElementById('internetMonitor');
  if(!root||root.offsetParent===null||!globalThis.echarts)return;
  root.querySelectorAll('.internet-chart').forEach(el=>{
    try{globalThis.echarts.getInstanceByDom(el)?.resize();}catch{}
  });
}

function scheduleResize(){
  requestAnimationFrame(()=>requestAnimationFrame(resizeInternetCharts));
  setTimeout(resizeInternetCharts,180);
  setTimeout(resizeInternetCharts,700);
}

globalThis.addEventListener('kicc:tabchange',event=>{
  if(event?.detail?.tab==='internet')scheduleResize();
});
globalThis.addEventListener('resize',()=>{
  const panel=document.querySelector('[data-kicc-panel="internet"]');
  if(panel&&!panel.hidden)scheduleResize();
});

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible')return;
  const panel=document.querySelector('[data-kicc-panel="internet"]');
  if(panel&&!panel.hidden)scheduleResize();
});

const panel=document.querySelector('[data-kicc-panel="internet"]');
if(panel&&!panel.hidden)scheduleResize();

globalThis.KICC_INTERNET_VISIBILITY={resizeInternetCharts,scheduleResize};
