/* Pawplay stage 18: online mode parity - "სხვა კითხვა" and rematch in an online room.
   Additive; loaded after stage17.js. Uses only fields that firebase-rules.json already allows
   (qs, acc, i, s, ph, a, g, t), so the rules do not change. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var MAX_SWAPS=3,online=false,swaps={},extra={},lastT=null,lastK=null;
[['onlineBtn',true],['joinBtn',true],['createGame',false]].forEach(function(x){
  var b=$('#'+x[0]);if(b)b.addEventListener('click',function(){online=x[1];lastT=null;lastK=null},true);
});
function live(){return online&&typeof O!=='undefined'&&O&&typeof roomRef!=='undefined'&&roomRef&&O.k}

/* which pool do the room's questions come from? (the room does not store the category) */
function mixIndex(){for(var i=0;i<categories.length;i++)if(categories[i].name==='შერეული')return i;return -1}
function inferPool(v){
  if(v.duel)return pool(6);
  if(window.pawFavPool){var fp=window.pawFavPool(v.qs);if(fp)return fp}
  var hit={},n=0;
  categories.forEach(function(c,i){if(i===6)return;
    var f=0;v.qs.forEach(function(t){if(c.questions.indexOf(t)>-1)f++});
    if(f){hit[i]=f;n++}});
  var keys=Object.keys(hit);
  if(keys.length===1)return pool(+keys[0]);
  if(keys.length>1&&mixIndex()>-1)return pool(mixIndex());
  return null;
}
function spares(v){
  var p=inferPool(v);if(!p)return [];
  var used={};v.qs.forEach(function(t){used[t]=1});
  return p.filter(function(q){return !used[q.t]});
}
function leftSwaps(v){return Math.max(0,Math.min(MAX_SWAPS+(extra[v.k]||0)-(swaps[v.k]||0),spares(v).length))}
/* stage 24: the "+" button adds one more allowed swap in this room, as long as unused questions remain */
window.pawMoreSwapsOnline={can:function(){var v=O;return !!(live()&&v&&v.p&&v.p[1]&&v.ph==='answer'&&v.i<v.qs.length&&me===v.i%2&&$('#gIn')&&leftSwaps(v)<spares(v).length)},add:function(){if(O)extra[O.k]=(extra[O.k]||0)+1}};

/* ---------- 18.1 swap the question (only the player who is answering, before answering) ---------- */
function swap(){
  var v=O;if(!live()||v.ph!=='answer'||me!==v.i%2||!leftSwaps(v))return;
  var sp=shuffle(spares(v)),nq=sp[0];if(!nq)return;
  var up={};up['qs/'+v.i]=nq.t;up['acc/'+v.i]=nq.acc.length?nq.acc:[''];
  swaps[v.k]=(swaps[v.k]||0)+1;
  roomRef.update(up).catch(function(){swaps[v.k]--;toast('შეცვლა ვერ მოხერხდა.')});
}
function postSwap(){
  if(!live()||!O.p||!O.p[1]||O.ph!=='answer'||O.i>=O.qs.length||me!==O.i%2||!$('#gIn'))return;
  var n=leftSwaps(O);if(!n)return;
  var acts=$('#gBody .demo-actions');if(!acts||$('#gSwap'))return;
  var b=document.createElement('button');
  b.type='button';b.id='gSwap';b.className='btn btn-ghost swap-btn';
  b.textContent='🔄 სხვა კითხვა ('+n+')';b.setAttribute('aria-label','კითხვის შეცვლა სხვა კითხვით, დარჩენილია '+n);
  b.onclick=swap;acts.insertAdjacentElement('beforebegin',b);
}

/* ---------- 18.2 rematch in the same room (either player can start it) ---------- */
function rematch(){
  var v=O;if(!live()||!v.p||!v.p[1])return;
  var n=v.qs.length,p=inferPool(v),qs;
  if(p&&p.length>=n)qs=shuffle(p).slice(0,n);
  else qs=shuffle(v.qs.map(function(t,i){return {t:t,acc:((v.acc&&v.acc[i])||[]).filter(Boolean)}}));
  roomRef.update({qs:qs.map(function(q){return q.t}),acc:qs.map(function(q){return q.acc.length?q.acc:['']}),
    i:0,s:[0,0],ph:'answer',a:'',g:'',t:Date.now()})
   .then(function(){toast('რევანში დაიწყო!')})
   .catch(function(){toast('რევანში ვერ დაიწყო.')});
}

/* ---------- hooks ---------- */
var _do=drawOnline;
drawOnline=function(){
  try{
    /* a new game in the same room (t changed): start the recap list from zero */
    if(O&&lastK===O.k&&lastT!==null&&O.t!==lastT&&O.i===0){if(window.pawResetRecap)window.pawResetRecap();swaps[O.k]=0;extra[O.k]=0}
    if(O){lastK=O.k;lastT=O.t}
  }catch(e){}
  _do.apply(this,arguments);
  try{postSwap()}catch(e){}
};
var _r=result;
result=function(b){
  _r.apply(this,arguments);
  try{
    if(!live()||$('#gRematch'))return;
    var again=$('#gAgain');if(!again)return;
    var rb=document.createElement('button'),tm=null;
    rb.type='button';rb.id='gRematch';rb.className='btn btn-primary full';rb.textContent='🔁 რევანში ამავე ოთახში';
    rb.onclick=function(){
      if(rb.dataset.sure){clearTimeout(tm);rb.disabled=true;rematch();return}
      rb.dataset.sure='1';rb.textContent='დაჭერე კიდევ ერთხელ — ორივესთვის დაიწყება ახალი თამაში';
      tm=setTimeout(function(){rb.dataset.sure='';rb.textContent='🔁 რევანში ამავე ოთახში'},3500);
    };
    again.parentNode.insertAdjacentElement('afterend',rb);
  }catch(e){}
};
})();
