/* Pawplay stage 14: additive extras (even counts, timer, history, sound/haptics).
   Loaded after extras.js. Wraps existing functions; earlier files are not edited. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)},$$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var demo=$('#demoModal'),LS={get:function(k,d){try{var v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

/* ---------- which mode are we in (set before the game starts) ---------- */
var online=false,tmKey=null;
[['createGame',false],['onlineBtn',true],['joinBtn',true]].forEach(function(x){var b=$('#'+x[0]);if(b)b.addEventListener('click',function(){online=x[1];tmKey=null},true)});

/* ---------- settings controls in the game window ---------- */
(function(){
  var qc=$('#questionCount'),lab=qc&&qc.closest('label');if(!lab)return;
  lab.insertAdjacentHTML('afterend',
   '<label>ტაიმერი ერთ პასუხზე<select id="timerSel"><option value="0">გამორთული</option><option value="20">20 წამი</option><option value="30">30 წამი</option><option value="45">45 წამი</option></select></label>'+
   '<label class="chk"><input type="checkbox" id="optSnd"> ხმა და ვიბრაცია</label>'+
   '<label class="chk"><input type="checkbox" id="optHist"> შედეგების შენახვა ამ მოწყობილობაზე</label>');
  var ts=$('#timerSel'),os=$('#optSnd'),oh=$('#optHist');
  ts.value=LS.get('pawplay_timer','0');if(ts.value!==LS.get('pawplay_timer','0'))ts.value='0';
  os.checked=LS.get('pawplay_snd','1')==='1';oh.checked=LS.get('pawplay_hist','1')==='1';
  ts.onchange=function(){LS.set('pawplay_timer',ts.value)};
  os.onchange=function(){LS.set('pawplay_snd',os.checked?'1':'0');syncSnd()};
  oh.onchange=function(){LS.set('pawplay_hist',oh.checked?'1':'0')};
  var m=$('#demoModal .modal');
  m.insertAdjacentHTML('beforeend','<button class="snd" id="sndBtn" type="button" aria-label="ხმა და ვიბრაცია"></button>');
  $('#sndBtn').onclick=function(){os.checked=!os.checked;os.onchange()};
  syncSnd();
  function syncSnd(){var b=$('#sndBtn');b.textContent=os.checked?'🔊':'🔇';b.setAttribute('aria-pressed',os.checked?'true':'false')}
})();

/* ---------- stage 14.1: even question counts (fair turns) ---------- */
var _fc=fillCounts;
fillCounts=function(){
  _fc();
  var sel=$('#questionCount');if(!sel||+$('#gameCategory').value===6)return;
  var vals=[].map.call(sel.options,function(o){return +o.value}),set=[];
  vals.forEach(function(v,i){if(v%2)v=(i===vals.length-1)?v-1:0;if(v>=2&&set.indexOf(v)<0)set.push(v)});
  if(!set.length)return;
  var keep=set.indexOf(10)>-1?10:set[0];
  sel.innerHTML=set.map(function(v){return '<option'+(v===keep?' selected':'')+'>'+v+'</option>'}).join('');
};
$('#gameCategory').onchange=fillCounts;
fillCounts();

/* ---------- stage 14.4: sound + haptics ---------- */
var AC=null;
function sndOn(){var o=$('#optSnd');return !o||o.checked}
function tone(f,d,at,type,vol){
  var o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+at;
  o.type=type||'sine';o.frequency.value=f;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||0.12,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+0.05);
}
var SOUNDS={
  ok:{n:[[660,.12,0],[880,.18,.11]],v:[30]},
  no:{n:[[220,.25,0,'triangle']],v:[70]},
  win:{n:[[523,.14,0],[659,.14,.13],[784,.14,.26],[1046,.34,.39]],v:[40,60,40,60,140]},
  tick:{n:[[1000,.05,0,'square',.05]],v:null}
};
function play(k){
  if(!sndOn())return;var s=SOUNDS[k];if(!s)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
    s.n.forEach(function(x){tone(x[0],x[1],x[2],x[3],x[4])});
  }catch(e){}
  try{if(s.v&&navigator.vibrate)navigator.vibrate(s.v)}catch(e){}
}
$('#gBody').addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('button');if(!b)return;
  if(b.id==='gYes'||b.id==='gA'||b.id==='gB')play('ok');else if(b.id==='gNo')play('no');
},true);

/* ---------- stage 14.2: answer timer ---------- */
var tmInt=null,tmEnd=0;
function stopTimer(){clearInterval(tmInt);tmInt=null}
function stateKey(){
  if(online&&typeof O!=='undefined'&&O)return O.i+'|'+O.ph+'|'+((O.qs&&O.qs[O.i])||'');
  if(typeof G!=='undefined'&&G)return G.i+'|'+G.ph+'|'+(G.sw||0);
  return '';
}
function expire(){
  var i=$('#gIn');if(!i)return;
  if(!i.value.trim()){var sk=$('#gSkip');if(sk){sk.click();return}i.value='⏱ დრო ამოიწურა'}
  var ok=$('#gOk');if(ok)ok.click();
}
function timerHook(){
  stopTimer();
  var ts=$('#timerSel'),secs=ts?+ts.value:0,inp=$('#gIn');
  if(online&&typeof O!=='undefined'&&O&&typeof O.tm==='number')secs=O.tm; /* stage 39: the host's timer choice is stored in the room */
  if(!secs||!inp||!demo.classList.contains('show')){tmKey=null;return}
  /* stage 26: the timer is only for the player who guesses; the player who answers about himself has no time limit */
  var ph=(online&&typeof O!=='undefined'&&O)?O.ph:(typeof G!=='undefined'&&G?G.ph:'');
  if(ph==='answer'){tmKey=null;return}
  var key=stateKey();if(key!==tmKey){tmKey=key;tmEnd=Date.now()+secs*1000}
  var bar=document.createElement('div');bar.id='tmBar';bar.className='tm';bar.setAttribute('aria-hidden','true');bar.innerHTML='<span></span><b></b>';
  var meta=$('#gBody .demo-meta');if(meta)meta.insertAdjacentElement('afterend',bar);else $('#gBody').insertAdjacentElement('afterbegin',bar);
  var last=-1;
  function tick(){
    if(!demo.classList.contains('show')||!document.body.contains(bar)){stopTimer();return}
    if($('#leaveBox')||window.pawPaused)tmEnd+=200;
    var left=Math.max(0,tmEnd-Date.now()),s=Math.ceil(left/1000);
    bar.firstChild.style.width=(left/(secs*1000)*100)+'%';bar.lastChild.textContent=s+' წ';
    if(s<=3&&s>0&&s!==last){last=s;play('tick')}
    if(left<=0){stopTimer();expire()}
  }
  tick();tmInt=setInterval(tick,200);
}
var _d1=draw;draw=function(){_d1.apply(this,arguments);timerHook()};
if(typeof drawOnline==='function'){var _d2=drawOnline;drawOnline=function(){_d2.apply(this,arguments);timerHook()}}

/* ---------- stage 14.3: result history ---------- */
var HK='pawplay_history',seen={},seq=0;
function loadH(){try{var a=JSON.parse(LS.get(HK,'[]'));return Array.isArray(a)?a:[]}catch(e){return []}}
function saveH(a){LS.set(HK,JSON.stringify(a.slice(-100)))}
function token(){
  if(online&&typeof O!=='undefined'&&O&&O.k)return 'o'+O.k+':'+O.t;
  if(G&&!G.__tok)G.__tok='g'+(++seq)+':'+Date.now();
  return G?G.__tok:'';
}
function keyOf(p){return p.map(function(x){return String(x).trim().toLowerCase()}).sort().join('|')}
function pairLine(p){
  var h=loadH().filter(function(r){return keyOf(r.p)===keyOf(p)});if(h.length<2)return '';
  var w={},d=0;p.forEach(function(n){w[n]=0});
  h.forEach(function(r){
    if(r.s[0]===r.s[1]){d++;return}
    var name=r.s[0]>r.s[1]?r.p[0]:r.p[1];
    var hit=p.filter(function(n){return n.trim().toLowerCase()===String(name).trim().toLowerCase()})[0];
    if(hit!==undefined)w[hit]++;
  });
  return esc(p[0])+' '+w[p[0]]+' · '+esc(p[1])+' '+w[p[1]]+' · ფრე '+d+' ('+h.length+' თამაში)';
}
var _res=result;
result=function(b){
  var tk=token(),first=!seen[tk];
  if(first){
    seen[tk]=1;
    var oh=$('#optHist');
    if(!oh||oh.checked){var a=loadH();a.push({t:Date.now(),p:G.p.slice(),s:G.s.slice(),d:!!G.duel});saveH(a);renderHist()}
    play('win');
  }
  _res(b);
  try{
    var line=pairLine(G.p),sb=b.querySelector('.scoreboard');
    if(line&&sb)sb.insertAdjacentHTML('afterend','<p class="pair-line">'+line+'</p>');
  }catch(e){}
};
function fmtDate(t){try{return new Date(t).toLocaleDateString('ka-GE',{day:'numeric',month:'short'})}catch(e){return ''}}
function renderHist(){
  var sec=$('#history'),a=loadH();if(!sec)return;
  if(!a.length){sec.hidden=true;return}
  sec.hidden=false;
  $('#histSum').textContent='სულ '+a.length+' თამაში ამ მოწყობილობაზე.';
  $('#histList').innerHTML=a.slice().reverse().slice(0,8).map(function(r){
    if(r.g)return '<li><span>'+r.p.map(esc).join(' × ')+'<small>'+fmtDate(r.t)+' · ჯგუფი'+(r.d?' · გამოწვევები':'')+'</small></span><em class="ok">'+r.s.join(' : ')+' · '+(r.w==='ფრე'?'ფრე':'🏆 '+esc(r.w))+'</em></li>';
    var res=r.s[0]===r.s[1]?'ფრე':'🏆 '+esc(r.s[0]>r.s[1]?r.p[0]:r.p[1]);
    return '<li><span>'+esc(r.p[0])+' × '+esc(r.p[1])+'<small>'+fmtDate(r.t)+(r.d?' · დუელი':'')+'</small></span><em class="'+(r.s[0]===r.s[1]?'':'ok')+'">'+r.s[0]+' : '+r.s[1]+' · '+res+'</em></li>';
  }).join('');
}
window.pawRenderHist=function(){renderHist()};
(function(){
  var faq=$('#faq');if(!faq)return;
  faq.insertAdjacentHTML('beforebegin','<section class="section" id="history" hidden><div class="section-heading"><div class="eyebrow">შენი შედეგები</div><h2>ბოლო <span>თამაშები</span></h2></div><div class="sample-card"><p class="hist-sum" id="histSum"></p><ul class="sample-list" id="histList"></ul><button class="btn btn-ghost" id="histClear" type="button">ისტორიის გასუფთავება</button></div></section>');
  var clr=$('#histClear'),tmr=null;
  clr.onclick=function(){
    if(clr.dataset.sure){LS.set(HK,'[]');clr.dataset.sure='';clr.textContent='ისტორიის გასუფთავება';clearTimeout(tmr);renderHist();return}
    clr.dataset.sure='1';clr.textContent='დარწმუნებული ხარ? დააჭირე კიდევ ერთხელ';
    tmr=setTimeout(function(){clr.dataset.sure='';clr.textContent='ისტორიის გასუფთავება'},3500);
  };
  renderHist();
  $$('.faq details').forEach(function(d){
    var s=d.querySelector('summary').textContent,p=d.querySelector('p');
    if(p&&s.indexOf('ინახება')>-1)p.textContent+=' გარდა ამისა, ბრაუზერში ინახება შედეგების მოკლე ისტორია (სახელები და ქულები). მისი გამორთვა თამაშის შექმნისას შეგიძლია, წაშლა კი „შენი შედეგები“ განყოფილებიდან.';
  });
})();
})();
