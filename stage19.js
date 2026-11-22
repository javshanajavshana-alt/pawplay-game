/* Pawplay stage 19: "↩ უკან" (undo one step) and "⏸ პაუზა". Additive; loaded after stage18.js.
   One-device mode only. Undo is not offered on the result screen or in online rooms. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var modal=$('#demoModal .modal'),online=false,curG=null,stack=[],restoring=false;
[['onlineBtn',true],['joinBtn',true],['createGame',false]].forEach(function(x){
  var b=$('#'+x[0]);if(b)b.addEventListener('click',function(){online=x[1];setPause(false)},true);
});

/* ---------- toolbar buttons ---------- */
modal.insertAdjacentHTML('beforeend',
 '<button class="snd tb" id="undoBtn" type="button" aria-label="ერთი ნაბიჯით უკან" style="right:100px" hidden>↩</button>'+
 '<button class="snd tb" id="pauseBtn" type="button" aria-label="პაუზა" style="right:140px" hidden>⏸</button>');
var ub=$('#undoBtn'),pb=$('#pauseBtn');

/* ---------- 19.2 pause (stops the answer timer and hides the question) ---------- */
function setPause(on){
  window.pawPaused=!!on;
  var box=$('#pauseBox');
  if(!on){if(box)box.remove();return}
  if(box)return;
  box=document.createElement('div');box.id='pauseBox';box.className='pause-box';box.setAttribute('role','alertdialog');box.setAttribute('aria-label','პაუზა');
  box.innerHTML='<div class="pass">⏸</div><p>თამაში დაპაუზებულია</p><button class="btn btn-primary" id="pauseGo" type="button">▶ გაგრძელება</button>';
  modal.appendChild(box);$('#pauseGo').onclick=function(){setPause(false)};$('#pauseGo').focus();
}
pb.onclick=function(){setPause(true)};

/* ---------- 19.1 undo: snapshot every distinct screen, go back one ---------- */
function snap(){return {i:G.i,ph:G.ph,s:G.s.slice(),a:G.a,g:G.g}}
function record(){
  if(online||!G||!G.qs||G.i>=G.qs.length)return;
  if(curG!==G){curG=G;stack=[]}
  var t=stack[stack.length-1];
  if(t&&t.i===G.i&&t.ph===G.ph)return;
  stack.push(snap());
}
function undo(){
  if(online||!G||stack.length<2||G.i>=G.qs.length)return;
  var cur=stack.pop(),prev=stack[stack.length-1];
  if(prev.ph==='reveal'&&cur.i!==prev.i&&window.pawPopRecap)window.pawPopRecap(); /* a scored answer is taken back */
  G.i=prev.i;G.ph=prev.ph;G.s=prev.s.slice();
  /* never bring back a hidden answer that should not be on screen */
  G.a=(prev.ph==='answer')?'':prev.a;G.g=(prev.ph==='reveal')?prev.g:'';
  restoring=true;draw();restoring=false;
  toast('ერთი ნაბიჯით უკან');
}
ub.onclick=undo;

function sync(){
  var run=!online&&G&&G.qs&&G.i<G.qs.length&&demoOpen()&&!$('#gAgain');
  pb.hidden=!run;ub.hidden=!run;ub.disabled=!(run&&stack.length>1);ub.style.opacity=ub.disabled?'.35':'';
}
function demoOpen(){return $('#demoModal').classList.contains('show')}
var _d=draw;
draw=function(){
  setPause(false);
  _d.apply(this,arguments);
  try{if(!restoring)record();sync()}catch(e){}
};
var _r=result;
result=function(){_r.apply(this,arguments);try{sync()}catch(e){}};
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-close="demoModal"],#leaveGo'))setTimeout(sync,0)},true);
})();
