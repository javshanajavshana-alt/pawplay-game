/* Pawplay stage 15: "სხვა კითხვა" (swap the current question). Additive; loaded after stage14.js.
   Local (one-device) mode only. Only available while the answering player has not answered yet. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var MAX_SWAPS=3;           /* swaps allowed per game */
var cat=null;

/* remember the category and prepare the spare questions right after the game is created */
var cg=$('#createGame');
if(cg){
  cg.addEventListener('click',function(){cat=+$('#gameCategory').value},true);
  cg.addEventListener('click',function(){
    if(!G||!G.qs)return;
    var used={};G.qs.forEach(function(q){used[q.t]=1});
    G.spare=shuffle(pool(cat).filter(function(q){return !used[q.t]}));
    G.sw=0;
    draw();   /* the game was already drawn once before the spares existed */
  });
}
function left(){return Math.max(0,Math.min(MAX_SWAPS+(G.swx||0)-(G.sw||0),(G.spare||[]).length))}
/* stage 24: the "+" button adds one more allowed swap (G.swx), as long as unused questions remain */
window.pawMoreSwapsLocal={can:function(){return !!(G&&G.spare&&G.ph==='answer'&&$('#gSkip')&&left()<G.spare.length)},add:function(){G.swx=(G.swx||0)+1}};

function swap(){
  if(!G||G.ph!=='answer'||!left())return;
  var old=G.qs[G.i],nq=G.spare.shift();
  G.spare.push(old);          /* the old one may come back much later */
  G.qs[G.i]=nq;G.sw=(G.sw||0)+1;
  toast('კითხვა შეიცვალა');
  draw();
}

function post(){
  if(!G||!G.qs||!G.spare||G.ph!=='answer'||!$('#gSkip'))return;
  var n=left();if(!n)return;
  var acts=$('#gBody .demo-actions');if(!acts)return;
  var b=document.createElement('button');
  b.type='button';b.id='gSwap';b.className='btn btn-ghost swap-btn';
  b.textContent='🔄 სხვა კითხვა ('+n+')';
  b.setAttribute('aria-label','კითხვის შეცვლა სხვა კითხვით, დარჩენილია '+n);
  b.onclick=swap;
  acts.insertAdjacentElement('beforebegin',b);
}
var _d=draw;draw=function(){_d.apply(this,arguments);try{post()}catch(e){}};
})();
