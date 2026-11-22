/* Pawplay stage 23: own question count and own timer length.
   Additive. Loaded after stage20.js. Works by putting the typed number into the existing
   <select> as an extra option, so every earlier script keeps reading select.value. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var DUEL=6,TMIN=5,TMAX=300,CMIN=2;
var sel=$('#questionCount'),ts=$('#timerSel'),cat=$('#gameCategory');
if(!sel||!ts||!cat)return;
function lsGet(k,d){try{var v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}

/* ---------- markup ---------- */
sel.closest('label').insertAdjacentHTML('afterend',
 '<label class="own">ან ჩაწერე საკუთარი რაოდენობა<input id="ownCount" type="number" inputmode="numeric" min="'+CMIN+'" step="1" placeholder="მაგ. 14"></label><small class="own-hint" id="ownCountHint" aria-live="polite"></small>');
ts.closest('label').insertAdjacentHTML('afterend',
 '<label class="own">ან ჩაწერე საკუთარი წამები ('+TMIN+'–'+TMAX+')<input id="ownTimer" type="number" inputmode="numeric" min="'+TMIN+'" max="'+TMAX+'" step="1" placeholder="მაგ. 60"></label><small class="own-hint" id="ownTimerHint" aria-live="polite"></small>');
var cIn=$('#ownCount'),cHint=$('#ownCountHint'),tIn=$('#ownTimer'),tHint=$('#ownTimerHint');

/* ---------- helpers ---------- */
function dropCustom(s){[].slice.call(s.options).forEach(function(o){if(o.dataset.own)o.remove()})}
function useValue(s,n,label){
  dropCustom(s);
  var hit=[].filter.call(s.options,function(o){return +o.value===n})[0];
  if(hit){hit.selected=true;return}
  var o=document.createElement('option');o.value=String(n);o.textContent=label||String(n);o.dataset.own='1';
  /* keep the list in numeric order */
  var after=[].filter.call(s.options,function(x){return +x.value>n&&+x.value!==0})[0];
  if(after)s.insertBefore(o,after);else s.appendChild(o);
  o.selected=true;
}
function maxCount(){
  var m=0;[].forEach.call(sel.options,function(o){if(!o.dataset.own&&+o.value>m)m=+o.value});
  return m;
}

/* ---------- question count ---------- */
function applyCount(final){
  var raw=cIn.value.trim();cHint.textContent='';
  if(raw===''){dropCustom(sel);return}
  var n=parseInt(raw,10),max=maxCount();
  if(isNaN(n)){if(final)cIn.value='';return}
  if(!final){ /* while typing: apply only complete, valid numbers */
    if(n>=CMIN&&n<=max&&(n%2===0||+cat.value===DUEL))useValue(sel,n);
    return;
  }
  var msg='';
  if(n<CMIN){n=CMIN;msg='მინიმუმ '+CMIN+' კითხვა.'}
  if(n>max){n=max;msg='ამ კატეგორიაში მაქსიმუმ '+max+' კითხვაა.'}
  if(n%2&&+cat.value!==DUEL){n=n-1;msg='რაოდენობა ლუწი უნდა იყოს (თითოეულს თანაბარი რაოდენობა ექნება). დაყენდა '+n+'.'}
  if(n<CMIN||!max){cIn.value='';dropCustom(sel);return}
  cIn.value=n;useValue(sel,n);cHint.textContent=msg;
}
cIn.addEventListener('input',function(){applyCount(false)});
cIn.addEventListener('change',function(){applyCount(true)});
sel.addEventListener('change',function(){cIn.value='';cHint.textContent='';dropCustom(sel)});

/* the list is rebuilt when the category changes: keep the typed number if it still fits */
var _fc=fillCounts;
fillCounts=function(){
  _fc();
  if(cIn.value.trim()==='')return;
  var before=cIn.value;applyCount(true);
  if(cIn.value!==before&&!cHint.textContent)cHint.textContent='';
};
cat.onchange=fillCounts;

/* ---------- timer ---------- */
function timerLabel(n){return n+' წამი'}
function applyTimer(final){
  var raw=tIn.value.trim();tHint.textContent='';
  if(raw===''){return}
  var n=parseInt(raw,10);
  if(isNaN(n)){if(final)tIn.value='';return}
  if(!final){if(n>=TMIN&&n<=TMAX){useValue(ts,n,timerLabel(n));lsSet('pawplay_timer',String(n))}return}
  var msg='';
  if(n<TMIN){n=TMIN;msg='მინიმუმ '+TMIN+' წამი.'}
  if(n>TMAX){n=TMAX;msg='მაქსიმუმ '+TMAX+' წამი.'}
  tIn.value=n;useValue(ts,n,timerLabel(n));lsSet('pawplay_timer',String(n));tHint.textContent=msg;
}
tIn.addEventListener('input',function(){applyTimer(false)});
tIn.addEventListener('change',function(){applyTimer(true)});
ts.addEventListener('change',function(){tIn.value='';tHint.textContent='';dropCustom(ts)});
/* remember a custom timer between visits (stage 14 only knows the presets) */
(function(){
  var s=lsGet('pawplay_timer','0'),n=parseInt(s,10);
  if(String(n)===s&&n>=TMIN&&n<=TMAX&&![].some.call(ts.options,function(o){return o.value===s})){
    useValue(ts,n,timerLabel(n));tIn.value=n;
  }
})();

/* make sure the last typed values are applied before a game starts (runs before the other click handlers) */
var gm=$('#gameModal');
if(gm)gm.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('#createGame,#onlineBtn')){applyCount(true);applyTimer(true)}
},true);
})();
