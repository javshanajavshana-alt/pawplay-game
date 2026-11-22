/* Pawplay stage 25: question order ("who answers / who asks").
   Additive; loaded after stage24.js. One-device mode only (online rooms keep strict alternation).
   Meaning: the player who ANSWERS writes an answer about himself/herself; the other player ASKS,
   i.e. tries to guess that answer. The order is a repeating pattern: P answers n0 questions,
   then the other answers n1 questions, then again.  1/1 = the old behaviour (swap every question).
   Needs the small hooks in app.js (draw) and extras.js (recap): both call window.pawA(G). */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var MAXN=20,KEY='pawplay_order';
function lsGet(k,d){try{var v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
var n1=$('#playerOne'),n2=$('#playerTwo'),cg=$('#createGame');
if(!n1||!n2||!cg)return;
var anchor=n1.closest('.two-inputs')||cg;

/* ---------- markup ---------- */
anchor.insertAdjacentHTML('afterend',
 '<label>კითხვების თანმიმდევრობა<select id="orderSel">'+
 '<option value="alt"></option><option value="a0"></option><option value="a1"></option><option value="own"></option></select></label>'+
 '<div id="orderOwn" hidden>'+
  '<div class="two-inputs">'+
   '<label><span id="ordLbl0"></span><input id="ordN0" type="number" inputmode="numeric" min="1" max="'+MAXN+'" step="1" value="2"></label>'+
   '<label><span id="ordLbl1"></span><input id="ordN1" type="number" inputmode="numeric" min="1" max="'+MAXN+'" step="1" value="2"></label>'+
  '</div>'+
  '<label>ვინ იწყებს პასუხით<select id="ordFirst"><option value="0"></option><option value="1"></option></select></label>'+
 '</div>'+
 '<div class="order-prev" id="orderPrev" aria-live="polite"></div>'+
 '<small class="own-hint" id="orderHint" aria-live="polite"></small>');
var sel=$('#orderSel'),own=$('#orderOwn'),i0=$('#ordN0'),i1=$('#ordN1'),fs=$('#ordFirst'),prev=$('#orderPrev'),hint=$('#orderHint');

/* ---------- helpers ---------- */
function nm(i){var v=(i?n2:n1).value.trim();return v||('მოთამაშე '+(i+1))}
function clampN(inp){
  var v=Math.floor(+inp.value);
  if(!(v>=1)){v=1}if(v>MAXN){v=MAXN}
  var fixed=String(v)!==String(inp.value).trim();inp.value=v;return fixed;
}
/* current rule: n = [questions in a row for "first", questions in a row for the other], first = who answers first */
function rule(){
  var m=sel.value;
  if(m==='a0')return {n:[1,0],first:1};   /* P1 asks, P2 answers  */
  if(m==='a1')return {n:[1,0],first:0};   /* P2 asks, P1 answers  */
  if(m==='own')return {n:[Math.max(1,Math.floor(+i0.value)||1),Math.max(1,Math.floor(+i1.value)||1)],first:+fs.value===1?1:0};
  return {n:[1,1],first:0};
}
/* who ANSWERS question number i (0 or 1) - used by app.js and extras.js */
window.pawA=function(g){
  var r=g.rl||(g.rl=(window.pawRL||{n:[1,1],first:0}));
  var c=r.n[0]+r.n[1],pos=g.i%c;
  return pos<r.n[0]?r.first:1-r.first;
};
function publish(){window.pawRL=rule()}

/* ---------- texts that depend on the names ---------- */
function texts(){
  var a=nm(0),b=nm(1),o=sel.options;
  o[0].textContent='მონაცვლეობით — ყოველ კითხვაზე იცვლებით';
  o[1].textContent='მხოლოდ '+a+' ეკითხება · '+b+' პასუხობს';
  o[2].textContent='მხოლოდ '+b+' ეკითხება · '+a+' პასუხობს';
  o[3].textContent='საკუთარი თანმიმდევრობა…';
  $('#ordLbl0').textContent=a+' პასუხობს ზედიზედ (კითხვა)';
  $('#ordLbl1').textContent=b+' პასუხობს ზედიზედ (კითხვა)';
  fs.options[0].textContent=a;fs.options[1].textContent=b;
}
function preview(){
  var r=rule(),a=nm(0),b=nm(1),ini=function(i){return (i?b:a).charAt(0).toUpperCase()},out=[],c=r.n[0]+r.n[1],N=Math.min(16,Math.max(10,c*2+2));
  for(var i=0;i<N;i++){var pos=i%c,who=pos<r.n[0]?r.first:1-r.first;out.push('<span class="oc o'+who+'">'+ini(who)+'</span>')}
  var m=sel.value,t;
  if(m==='a0')t=esc(b)+' პასუხობს ყველა კითხვაზე, '+esc(a)+' ცდილობს გამოცნობას.';
  else if(m==='a1')t=esc(a)+' პასუხობს ყველა კითხვაზე, '+esc(b)+' ცდილობს გამოცნობას.';
  else t='ვინ პასუხობს კითხვებზე ზედიზედ:';
  prev.innerHTML='<div>'+t+'</div>'+(m==='a0'||m==='a1'?'':'<div class="oc-row">'+out.join('')+'<span class="oc more">…</span></div>');
}
function refresh(){texts();own.hidden=sel.value!=='own';publish();preview()}

/* ---------- events ---------- */
sel.onchange=function(){refresh();save()};
fs.onchange=function(){refresh();save()};
[i0,i1].forEach(function(inp){
  inp.oninput=function(){publish();preview()};
  inp.onchange=function(){
    var fixed=clampN(inp);
    hint.textContent=fixed?'რიცხვი უნდა იყოს 1-დან '+MAXN+'-მდე.':'';
    refresh();save();
  };
});
[n1,n2].forEach(function(x){x.addEventListener('input',function(){texts();preview()})});
/* make sure the freshest rule is used at the moment the game starts (and for the rematch, which clicks the same button) */
cg.addEventListener('click',function(){
  [i0,i1].forEach(clampN);publish();
  try{lsSet(KEY,JSON.stringify({m:sel.value,a:i0.value,b:i1.value,f:fs.value}))}catch(e){}
},true);
/* ---------- remember last choice on this device ---------- */
function save(){try{lsSet(KEY,JSON.stringify({m:sel.value,a:i0.value,b:i1.value,f:fs.value}))}catch(e){}}
try{
  var d=JSON.parse(lsGet(KEY,'null'));
  if(d){
    if(['alt','a0','a1','own'].indexOf(d.m)>-1)sel.value=d.m;
    if(+d.a>=1&&+d.a<=MAXN)i0.value=Math.floor(+d.a);
    if(+d.b>=1&&+d.b<=MAXN)i1.value=Math.floor(+d.b);
    if(d.f==='1')fs.value='1';
  }
}catch(e){}
refresh();

/* ---------- online mode keeps alternation: say so honestly ---------- */
(function(){
  var ob=$('#onlineBox');if(!ob)return;
  ob.insertAdjacentHTML('beforeend','<small class="note">ონლაინ ოთახში თანმიმდევრობა ჯერ ყოველთვის მონაცვლეობითია.</small>');
})();

})();
