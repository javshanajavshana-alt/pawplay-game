/* Pawplay stage 16: rematch button + remembered player names. Additive; loaded after stage15.js.
   Local (one-device) mode only. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var LS={get:function(k,d){try{var v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},del:function(k){try{localStorage.removeItem(k)}catch(e){}}};
var NK='pawplay_names',last=null,online=false;
var n1=$('#playerOne'),n2=$('#playerTwo');

/* ---------- 16.2 remembered names (only when result saving is on) ---------- */
function histOn(){var o=$('#optHist');return !o||o.checked}
try{var nm=JSON.parse(LS.get(NK,'null'));if(nm&&n1&&n2){if(typeof nm[0]==='string')n1.value=nm[0].slice(0,20);if(typeof nm[1]==='string')n2.value=nm[1].slice(0,20)}}catch(e){}
[['onlineBtn',true],['joinBtn',true]].forEach(function(x){var b=$('#'+x[0]);if(b)b.addEventListener('click',function(){online=true},true)});

var cg=$('#createGame');
if(cg){
  cg.addEventListener('click',function(){
    online=false;
    last={c:$('#gameCategory').value,n:$('#questionCount').value,p:[n1.value,n2.value]};
    if(histOn())LS.set(NK,JSON.stringify([n1.value.trim(),n2.value.trim()]));else LS.del(NK);
  },true);
}
/* clearing the history (second, confirming click) also forgets the names */
var hc=$('#histClear');
if(hc)hc.addEventListener('click',function(){if(hc.dataset.sure)LS.del(NK)},true);

/* ---------- 16.1 rematch ---------- */
function rematch(){
  if(!last||!cg)return;
  $('#gameCategory').value=last.c;fillCounts();
  var q=$('#questionCount');if([].some.call(q.options,function(o){return o.value===last.n}))q.value=last.n;
  /* swap the order, so the other player starts and answers first */
  n1.value=last.p[1];n2.value=last.p[0];
  cg.click();
}
var _r=result;
result=function(b){
  _r.apply(this,arguments);
  try{
    if(online||!last)return;
    var again=$('#gAgain');if(!again||$('#gRematch'))return;
    var rb=document.createElement('button');
    rb.type='button';rb.id='gRematch';rb.className='btn btn-primary full';rb.textContent='🔁 რევანში იგივე მოთამაშეებით';
    rb.onclick=rematch;
    again.parentNode.insertAdjacentElement('afterend',rb);
  }catch(e){}
};
})();
