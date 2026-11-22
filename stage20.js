/* Pawplay stage 20: favourite questions. Star a question during a game (one-device or online),
   favourites are kept on this device and become a playable category "ფავორიტები".
   Additive; loaded after stage19.js. Duel questions cannot be starred (they do not fit normal games). */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var KEY='pawplay_favs',MAXF=100,FAV=categories.length,online=false,modal=$('#demoModal .modal');
function load(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(function(f){return f&&typeof f.t==='string'}):[]}catch(e){return []}}
function save(a){try{localStorage.setItem(KEY,JSON.stringify(a.slice(0,MAXF)))}catch(e){}}
var favs=load();
function has(t){return favs.some(function(f){return f.t===t})}

categories.push({name:'ფავორიტები',icon:'⭐',desc:'შენი მონიშნული საყვარელი კითხვები, რომლებიც თამაშის დროს ⭐-ით შეინახე.',questions:[]});
var _pool=pool;
pool=function(c){
  if(c!==FAV)return _pool(c);
  return favs.map(function(f){return {t:f.t,acc:(f.a||[]).slice()}});
};
/* lets the online helpers (stage 18) recognise a room that was played from favourites */
window.pawFavPool=function(qs){return qs.length&&qs.every(has)?pool(FAV):null};

/* new option in the game window (the "add custom question" list is left alone) */
$('#gameCategory').appendChild(new Option('⭐ ფავორიტები',FAV));

/* ---------- starting a game from an empty / tiny favourites list ---------- */
function tooFew(){return +$('#gameCategory').value===FAV&&favs.length<2}
['createGame','onlineBtn'].forEach(function(id){
  var b=$('#'+id);if(!b)return;
  b.addEventListener('click',function(e){
    if(tooFew()){e.stopImmediatePropagation();e.preventDefault();toast('ფავორიტებით სათამაშოდ მინიმუმ 2 კითხვა მონიშნე ⭐-ით.')}
  },true);
});
var _rc=renderCategories;
function guard(){
  var card=document.querySelector('.category-card[data-cat="'+FAV+'"]');if(!card)return;
  var go=card.onclick;
  card.onclick=function(){if(favs.length<2)return toast('ჯერ მონიშნე მინიმუმ 2 კითხვა ⭐-ით თამაშის დროს.');go.call(card)};
  card.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();card.onclick()}};
}
renderCategories=function(){_rc();guard()};
renderCategories();

/* ---------- star button in the game window ---------- */
[['onlineBtn',true],['joinBtn',true],['createGame',false]].forEach(function(x){
  var b=$('#'+x[0]);if(b)b.addEventListener('click',function(){online=x[1]},true);
});
modal.insertAdjacentHTML('beforeend','<button class="snd tb" id="favBtn" type="button" style="right:180px" hidden></button>');
var fb=$('#favBtn');
function cur(){ /* the question on screen: {t,acc} or null */
  if(!$('#demoModal').classList.contains('show')||$('#gAgain'))return null;
  if(!online){
    if(typeof G==='undefined'||!G||!G.qs||G.i>=G.qs.length||G.duel)return null;
    var q=G.qs[G.i];return q?{t:q.t,acc:(q.acc||[]).slice()}:null;
  }
  if(typeof O==='undefined'||!O||!O.p||!O.p[1]||!O.qs||O.i>=O.qs.length||O.duel)return null;
  return {t:O.qs[O.i],acc:((O.acc&&O.acc[O.i])||[]).filter(Boolean)};
}
function sync(){
  var q=cur();fb.hidden=!q;if(!q)return;
  var on=has(q.t);fb.textContent=on?'⭐':'☆';fb.setAttribute('aria-pressed',on?'true':'false');
  fb.setAttribute('aria-label',on?'ფავორიტებიდან ამოშლა':'ფავორიტებში დამატება');
}
fb.onclick=function(){
  var q=cur();if(!q)return;
  if(has(q.t)){favs=favs.filter(function(f){return f.t!==q.t});toast('ამოღებულია ფავორიტებიდან')}
  else{
    if(favs.length>=MAXF)return toast('ფავორიტების ლიმიტია '+MAXF+'. ზოგი წაშალე.');
    favs.unshift({t:q.t.slice(0,300),a:q.acc.map(function(x){return String(x).slice(0,100)}).slice(0,10)});toast('დაემატა ფავორიტებში ⭐');
  }
  save(favs);sync();renderCategories();renderFavList();
};
var _d=draw;draw=function(){_d.apply(this,arguments);try{sync()}catch(e){}};
if(typeof drawOnline==='function'){var _o=drawOnline;drawOnline=function(){_o.apply(this,arguments);try{sync()}catch(e){}}}
var _r=result;result=function(){_r.apply(this,arguments);try{sync()}catch(e){}};
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-close="demoModal"],#leaveGo'))setTimeout(sync,0)},true);

/* ---------- favourites list (inside the "my questions" window) ---------- */
var my=$('#myQs');
if(my)my.insertAdjacentHTML('afterend','<div id="favList"></div>');
function renderFavList(){
  var e=$('#favList');if(!e)return;
  e.innerHTML=favs.length?'<h4>⭐ ფავორიტები</h4>'+favs.map(function(f,i){return '<div class="myq"><span>'+esc(f.t)+'</span><button type="button" data-fi="'+i+'" aria-label="წაშლა">🗑</button></div>'}).join(''):'';
  [].forEach.call(e.querySelectorAll('button'),function(b){b.onclick=function(){favs.splice(+b.dataset.fi,1);save(favs);renderFavList();renderCategories();sync()}});
}
var oc=$('#openCustom');if(oc)oc.addEventListener('click',renderFavList);
renderFavList();
})();
