/* Pawplay stage 39: online room settings.
   Pressing "ოთახის შექმნა" opens a settings window BEFORE the room code appears:
   categories (several at once), number of questions, who answers (alternate / random / only me / only the friend) and the timer.
   The choices are stored in the room (tm, cs, ord) so both players get the same game.
   Additive; loaded after stage38.js. Small hooks: app.js (startOnline / drawOnline), stage14.js (timer), stage18.js, extras.js.
   Needs the new firebase-rules.json (fields tm, cs, ord) to be published. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var ob=$('#onlineBtn'),gm=$('#gameModal');
if(!ob||!gm||typeof categories==='undefined'||typeof pool!=='function')return;
var DUEL=6,KEY='pawplay_room_opts',TMIN=5,TMAX=300;
function lsGet(k,d){try{var v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function favIdx(){for(var i=0;i<categories.length;i++)if(categories[i].name==='ფავორიტები')return i;return -1}
function exclusive(i){return i===DUEL||i===favIdx()}

/* ---------- who answers: stored in the room as a string of 0/1, one char per question (1 = the joining player answers) ---------- */
window.pawAOn=function(v){
  if(v&&typeof v.ord==='string'&&v.i<v.ord.length)return v.ord.charAt(v.i)==='1'?1:0;
  return v.i%2;
};
window.pawMkOrd=function(mode,n){
  var s='',i;
  if(mode==='a0'){for(i=0;i<n;i++)s+='0';return s}
  if(mode==='a1'){for(i=0;i<n;i++)s+='1';return s}
  var a=[];for(i=0;i<n;i++)a.push(i%2?'1':'0');
  if(mode==='alt')return a.join('');
  /* random: balanced (as many turns each), shuffled */
  for(i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}
  return a.join('');
};

/* ---------- markup ---------- */
var tmOpts=[['0','გამორთული'],['20','20 წამი'],['30','30 წამი'],['45','45 წამი'],['60','60 წამი'],['90','90 წამი']];
var cntOpts=[10,20,30,40,50,60,80,100];
document.body.insertAdjacentHTML('beforeend',
 '<div class="modal-backdrop" id="roomModal" role="dialog" aria-modal="true"><div class="modal">'+
 '<button class="close" aria-label="დახურვა" data-rm="close">×</button>'+
 '<div class="eyebrow">ონლაინ ოთახი</div><h2>ოთახის პარამეტრები</h2>'+
 '<p class="modal-sub">აირჩიე, როგორ ითამაშებთ. ოთახის კოდი ამის შემდეგ გამოჩნდება.</p>'+
 '<div class="rm-cats-t">კატეგორიები <small>(შეგიძლია რამდენიმე)</small></div><div id="rmCats"></div><small class="own-hint" id="rmCatHint" aria-live="polite"></small>'+
 '<label>კითხვების რაოდენობა<select id="rmCount">'+cntOpts.map(function(n){return '<option value="'+n+'">'+n+'</option>'}).join('')+'</select></label>'+
 '<label class="own">ან ჩაწერე საკუთარი რაოდენობა<input id="rmOwnCount" type="number" inputmode="numeric" min="2" step="1" placeholder="მაგ. 14"></label>'+
 '<small class="own-hint" id="rmCountHint" aria-live="polite"></small>'+
 '<label id="rmOrderLbl">ვინ პასუხობს<select id="rmOrder">'+
  '<option value="alt">მონაცვლეობით (ხან მე, ხან მეგობარი)</option>'+
  '<option value="rnd">არეულად (შემთხვევითი რიგით)</option>'+
  '<option value="a0">მხოლოდ მე ვპასუხობ, მეგობარი ცდილობს გამოიცნოს</option>'+
  '<option value="a1">მხოლოდ მეგობარი პასუხობს, მე ვცდილობ გამოვიცნო</option></select></label>'+
 '<small class="own-hint" id="rmOrderHint" aria-live="polite"></small>'+
 '<label>ტაიმერი (გამოცნობისას)<select id="rmTimer">'+tmOpts.map(function(o){return '<option value="'+o[0]+'">'+o[1]+'</option>'}).join('')+'</select></label>'+
 '<label class="own">ან ჩაწერე საკუთარი წამები ('+TMIN+'–'+TMAX+')<input id="rmOwnTimer" type="number" inputmode="numeric" min="'+TMIN+'" max="'+TMAX+'" step="1" placeholder="მაგ. 75"></label>'+
 '<button class="btn btn-primary full" id="rmGo" type="button">ოთახის შექმნა →</button>'+
 '<button class="btn btn-ghost full rm-back" id="rmBack" type="button">← უკან</button>'+
 '</div></div>');
var rm=$('#roomModal'),box=$('#rmCats'),catHint=$('#rmCatHint'),cSel=$('#rmCount'),cOwn=$('#rmOwnCount'),cHint=$('#rmCountHint'),
    oSel=$('#rmOrder'),oHint=$('#rmOrderHint'),oLbl=$('#rmOrderLbl'),tSel=$('#rmTimer'),tOwn=$('#rmOwnTimer');

/* ---------- categories ---------- */
function buildCats(){
  box.innerHTML=categories.map(function(c,i){
    return '<label class="chk rm-cat"><input type="checkbox" data-c="'+i+'"><span>'+c.icon+' '+c.name+' <small>('+pool(i).length+')</small></span></label>';
  }).join('');
}
function chosen(){return [].slice.call(box.querySelectorAll('input:checked')).map(function(x){return +x.dataset.c})}
function poolSize(cats){var sn={},n=0;cats.forEach(function(c){pool(c).forEach(function(q){if(!sn[q.t]){sn[q.t]=1;n++}})});return n}
box.addEventListener('change',function(e){
  var t=e.target;if(!t||!t.dataset||t.dataset.c===undefined)return;
  var i=+t.dataset.c,inputs=[].slice.call(box.querySelectorAll('input'));
  if(t.checked){
    inputs.forEach(function(x){var j=+x.dataset.c;if(j===i)return;if(exclusive(i)||exclusive(j))x.checked=false});
  }
  refresh();
});
function isDuel(cats){return cats.length===1&&cats[0]===DUEL}

/* ---------- counts / order / timer ---------- */
function wantCount(){
  var raw=cOwn.value.trim();
  if(raw!==''){var n=Math.floor(+raw);return n>=2?n:2}
  return +cSel.value;
}
function refresh(){
  var cats=chosen(),size=poolSize(cats),duel=isDuel(cats);
  catHint.textContent=!cats.length?'აირჩიე მინიმუმ ერთი კატეგორია.':(cats.length>1?'არჩეულია '+cats.length+' კატეგორია, სულ '+size+' კითხვა.':'');
  if(cats.length&&exclusive(cats[0])&&cats.length===1)catHint.textContent=(cats[0]===DUEL?'დუელი ცალკე რეჟიმია და სხვა კატეგორიებთან ვერ შეირევა.':'ფავორიტები ცალკე თამაშდება.');
  var n=wantCount(),msg='';
  if(cats.length&&n>size){n=size;msg='ამ არჩევანში მხოლოდ '+size+' კითხვაა, ამიტომ იქნება '+size+'.'}
  cHint.textContent=msg;
  oLbl.hidden=duel;oHint.textContent=duel?'დუელში ორივე პასუხობს და ქულას ვინც აირჩევს, ის იღებს.':(oSel.value==='alt'||oSel.value==='rnd'?'':'ამ რეჟიმში ქულას მხოლოდ ის აგროვებს, ვინც გამოიცნობს.');
  if(duel)oHint.hidden=false;
}
cSel.onchange=function(){cOwn.value='';refresh()};
cOwn.oninput=refresh;oSel.onchange=refresh;
tSel.onchange=function(){tOwn.value=''};
function wantTimer(){
  var raw=tOwn.value.trim();
  if(raw!==''){var n=Math.floor(+raw);if(n>=TMIN&&n<=TMAX)return n;return null}
  return +tSel.value;
}

/* ---------- open / close ---------- */
function open(){
  buildCats();
  var saved={};try{saved=JSON.parse(lsGet(KEY,'{}'))||{}}catch(e){}
  var cur=+($('#gameCategory')||{}).value,def=(saved.c&&saved.c.length)?saved.c:(isNaN(cur)?[0]:[cur]);
  def.forEach(function(i){var x=box.querySelector('input[data-c="'+i+'"]');if(x)x.checked=true});
  if(!chosen().length){var f=box.querySelector('input');if(f)f.checked=true}
  var qc=+($('#questionCount')||{}).value;if(qc&&[].some.call(cSel.options,function(o){return +o.value===qc}))cSel.value=String(qc);
  cOwn.value='';
  if(saved.o&&[].some.call(oSel.options,function(o){return o.value===saved.o}))oSel.value=saved.o;
  var tv=saved.t!==undefined?+saved.t:+lsGet('pawplay_timer','0');
  if(tv>=TMIN&&!tmOpts.some(function(o){return +o[0]===tv})&&tv<=TMAX){tSel.value='0';tOwn.value=tv}
  else tSel.value=tmOpts.some(function(o){return +o[0]===tv})?String(tv):'0';
  refresh();
  closeModal('gameModal');openModal('roomModal');
}
function close(back){closeModal('roomModal');if(back)openModal('gameModal')}
rm.addEventListener('click',function(e){
  if(e.target===rm)close(false);
  var b=e.target.closest&&e.target.closest('[data-rm="close"]');if(b)close(false);
});
$('#rmBack').onclick=function(){close(true)};
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&rm.classList.contains('show'))close(false)});

/* ---------- go ---------- */
$('#rmGo').onclick=function(){
  var cats=chosen();
  if(!cats.length)return toast('აირჩიე მინიმუმ ერთი კატეგორია.');
  var size=poolSize(cats);
  if(size<2)return toast(cats[0]===favIdx()?'ფავორიტებით სათამაშოდ მინიმუმ 2 კითხვა მონიშნე ⭐-ით.':'ამ არჩევანში ძალიან ცოტა კითხვაა.');
  var tm=wantTimer();if(tm===null)return toast('ტაიმერი უნდა იყოს '+TMIN+'–'+TMAX+' წამს შორის.');
  var duel=isDuel(cats),mode=duel?'alt':oSel.value,n=Math.min(wantCount(),size);
  if(!duel&&(mode==='alt'||mode==='rnd')&&n%2&&n>2)n--;   /* an even number keeps the turns fair */
  if(n<2)n=2;
  lsSet(KEY,JSON.stringify({c:cats,o:oSel.value,t:tm}));
  window.pawRoomOpts={cats:cats,n:n,mode:mode,tm:tm};
  /* keep the old selects in step so the other helper scripts see the same category */
  var gc=$('#gameCategory');if(gc)gc.value=String(cats[0]);
  closeModal('roomModal');
  window.__pawGo=true;ob.click();
};

/* the window opens instead of creating the room right away; the real click is replayed from "rmGo" */
document.addEventListener('click',function(e){
  var t=e.target&&e.target.closest?e.target.closest('#onlineBtn'):null;
  if(!t)return;
  if(window.__pawGo){window.__pawGo=false;return}
  e.stopPropagation();e.preventDefault();open();
},true);

/* the old "order stays alternating" note is no longer true */
var oldNote=[].filter.call(document.querySelectorAll('#onlineBox .note'),function(n){return n.textContent.indexOf('თანმიმდევრობა')>-1})[0];
if(oldNote)oldNote.textContent='ოთახის შექმნისას აირჩევ კატეგორიებს, რაოდენობას, ვინ პასუხობს და ტაიმერს.';
})();
