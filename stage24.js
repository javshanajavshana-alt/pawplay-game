/* Pawplay stage 24: "＋" next to "🔄 სხვა კითხვა" - allow one more swap whenever you want.
   Additive; loaded after stage23.js. Needs the small hooks in stage15.js (one-device) and stage18.js (online).
   Each click adds one swap; it is offered only while unused questions remain. The answer timer is not restarted. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};

function addPlus(api,redraw){
  if(!api||!api.can||!api.can())return false;
  var acts=$('#gBody .demo-actions');if(!acts||$('#gSwapPlus'))return false;
  var p=document.createElement('button');p.type='button';p.id='gSwapPlus';p.className='btn btn-ghost swap-plus';
  p.setAttribute('aria-label','კიდევ ერთი შეცვლის დამატება');p.title='დაამატე კიდევ ერთი შეცვლა';
  var sw=$('#gSwap');
  if(sw){
    var row=document.createElement('div');row.className='swap-row';
    sw.insertAdjacentElement('beforebegin',row);row.appendChild(sw);row.appendChild(p);p.textContent='＋';
  }else{
    p.classList.add('swap-plus-wide');p.textContent='＋ კიდევ ერთი შეცვლა';
    acts.insertAdjacentElement('beforebegin',p);
  }
  p.onclick=function(){
    var inp=$('#gIn'),keep=inp?inp.value:null;       /* do not lose a half-typed answer */
    api.add();redraw();
    var i2=$('#gIn');if(i2&&keep!==null&&!i2.value)i2.value=keep;
    if(typeof toast==='function')toast('დაემატა კიდევ ერთი შეცვლა');
  };
  return true;
}

var _d=draw;
draw=function(){_d.apply(this,arguments);try{addPlus(window.pawMoreSwapsLocal,function(){draw()})}catch(e){}};
if(typeof drawOnline==='function'){
  var _do=drawOnline;
  drawOnline=function(){_do.apply(this,arguments);try{addPlus(window.pawMoreSwapsOnline,function(){drawOnline()})}catch(e){}};
}
})();
