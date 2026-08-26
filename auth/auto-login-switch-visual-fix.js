function apply(){
  if(document.getElementById('kicc-auto-switch-visual-fix')) return;
  const style=document.createElement('style');
  style.id='kicc-auto-switch-visual-fix';
  style.textContent=`
    .kicc-auto-switch{
      width:60px!important;
      height:30px!important;
      padding:0!important;
      font-size:0!important;
      overflow:hidden!important;
    }
    .kicc-auto-switch::before{
      position:absolute;
      top:50%;
      transform:translateY(-50%);
      font-size:12px;
      font-weight:900;
      line-height:1;
      z-index:2;
      pointer-events:none;
    }
    .kicc-auto-switch:not(.on)::before{
      content:'O';
      right:8px;
      color:#e2e8f0;
    }
    .kicc-auto-switch.on::before{
      content:'I';
      left:9px;
      color:#fff;
    }
    .kicc-auto-switch::after{
      width:22px!important;
      height:22px!important;
      top:3px!important;
      left:4px!important;
    }
    .kicc-auto-switch.on::after{
      left:33px!important;
    }
  `;
  document.head.appendChild(style);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
else apply();

globalThis.KICC_AUTO_SWITCH_VISUAL_FIX={apply};
