/* Pawplay stage 30 (+32): group game for 3-4 players (one device) with the same settings as the 2-player window.
   Normal categories: one player ANSWERS (hidden, about himself/herself), the others GUESS; every correct guess = 1 point.
   Order: one fixed answerer / the answerer rotates every question / the answerer changes every N questions.
   Duel category (tasks): everybody answers in turn (hidden), then the group picks the winner of the question (or a tie).
   Timer: only for the guessers (duel: for everybody except the first player of a question). 5-8 players = paid (no payment built in).
   Additive; own game state (GG); the older one-device game (G) is not touched. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)},$$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var DUEL=6,MIX=7,FREE_MAX=4,PAID=[5,6,7,8],MIXMAX=50,TMIN=5,TMAX=300,CMIN=2,NMAX=20;
var gm=$('#gameModal'),sub=gm&&gm.querySelector('.modal-sub');
if(!gm||!sub)return;
function lsGet(k,d){try{var v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}

/* ---------- entry button inside the "create game" window ---------- */
sub.insertAdjacentHTML('afterend','<button class="btn btn-ghost full grp-entry" id="grpBtn" type="button">👥 2-ზე მეტი ადამიანის თამაში <small>(3–4 უფასოდ)</small></button>');

/* ---------- group window ---------- */
document.body.insertAdjacentHTML('beforeend',
 '<div class="modal-backdrop" id="groupModal" role="dialog" aria-modal="true" aria-labelledby="grpTitle"><div class="modal">'+
 '<button class="close" aria-label="დახურვა" id="grpClose" type="button">×</button>'+
 '<div class="eyebrow">ჯგუფური თამაში</div><h2 id="grpTitle">2-ზე მეტი ადამიანი</h2>'+
 '<p class="modal-sub">ერთი ადამიანი პასუხობს საკუთარ თავზე, დანარჩენები ცდილობენ გამოცნობას. თითო სწორ გამოცნობაზე — 1 ქულა.</p>'+
 '<div class="grp-h">თამაშის კატეგორია</div><div class="grp-cats" id="grpCats" role="radiogroup" aria-label="კატეგორია"></div>'+
 '<div class="grp-h">რამდენი მოთამაშე</div><div class="grp-counts" id="grpCount"></div>'+
 '<div class="grp-paid" id="grpPaid" hidden role="status"></div>'+
 '<div class="grp-h">სახელები</div><div id="grpNames"></div>'+
 '<div id="grpOrderBox">'+
  '<label>კითხვების თანმიმდევრობა<select id="grpOrder"><option value="fix"></option><option value="rot"></option><option value="own"></option></select></label>'+
  '<label id="grpOrdNLab" hidden>რამდენ კითხვაზე ზედიზედ პასუხობს ერთი ადამიანი (1–'+NMAX+')<input id="grpOrdN" type="number" inputmode="numeric" min="1" max="'+NMAX+'" step="1" value="2"></label>'+
  '<div class="grp-h" id="grpAnsH"></div><div class="grp-ans" id="grpAns" role="radiogroup" aria-label="პასუხის გამცემი"></div>'+
  '<small class="note" id="grpAnsNote"></small>'+
 '</div>'+
 '<small class="note" id="grpDuelNote" hidden>გამოწვევებში ყველა მოთამაშე რიგრიგობით პასუხობს, შემდეგ ერთად ირჩევთ ამ კითხვის გამარჯვებულს.</small>'+
 '<label>კითხვების რაოდენობა<select id="grpQn"></select></label>'+
 '<label class="own">ან ჩაწერე საკუთარი რაოდენობა<input id="grpOwnQn" type="number" inputmode="numeric" min="'+CMIN+'" step="1" placeholder="მაგ. 14"></label><small class="own-hint" id="grpQnHint" aria-live="polite"></small>'+
 '<label>ტაიმერი ერთ პასუხზე <small>(მხოლოდ გამომცნობს)</small><select id="grpTm"><option value="0">გამორთული</option><option value="20">20 წამი</option><option value="30">30 წამი</option><option value="45">45 წამი</option></select></label>'+
 '<label class="own">ან ჩაწერე საკუთარი წამები ('+TMIN+'–'+TMAX+')<input id="grpOwnTm" type="number" inputmode="numeric" min="'+TMIN+'" max="'+TMAX+'" step="1" placeholder="მაგ. 60"></label><small class="own-hint" id="grpTmHint" aria-live="polite"></small>'+
 '<label class="chk"><input type="checkbox" id="grpSnd"> ხმა და ვიბრაცია</label>'+
 '<label class="chk"><input type="checkbox" id="grpHist"> შედეგების შენახვა ამ მოწყობილობაზე</label>'+
 '<button class="btn btn-primary full" id="grpStart" type="button">თამაშის დაწყება →</button>'+
 '</div></div>');
var gr=$('#groupModal'),cats=$('#grpCats'),cnt=$('#grpCount'),names=$('#grpNames'),ansBox=$('#grpAns'),qn=$('#grpQn'),paid=$('#grpPaid');
var ord=$('#grpOrder'),ordN=$('#grpOrdN'),ownQn=$('#grpOwnQn'),qnHint=$('#grpQnHint'),tm=$('#grpTm'),ownTm=$('#grpOwnTm'),tmHint=$('#grpTmHint'),gSnd=$('#grpSnd'),gHist=$('#grpHist');
var S={cat:0,n:3,ans:0,names:['','','','']};

function isDuel(){return S.cat===DUEL}
function catList(){
  var out=[];
  for(var i=0;i<categories.length;i++){var n=pool(i).length;out.push({i:i,c:categories[i],n:n,ok:n>=2})}
  return out;
}
function drawCats(){
  var L=catList();if(!L.some(function(x){return x.i===S.cat&&x.ok}))S.cat=(L.filter(function(x){return x.ok})[0]||{i:0}).i;
  cats.innerHTML=L.map(function(x){
    return '<button type="button" role="radio" aria-checked="'+(x.i===S.cat)+'" class="grp-cat'+(x.i===S.cat?' sel':'')+'" data-c="'+x.i+'"'+(x.ok?'':' disabled')+'><span class="gi">'+x.c.icon+'</span><span class="gn">'+esc(x.c.name)+'</span><small>'+x.n+' კითხვა</small></button>';
  }).join('');
  $$('#grpCats .grp-cat').forEach(function(b){b.onclick=function(){S.cat=+b.dataset.c;drawCats();fillQn();syncOrder()}});
}
function drawCounts(){
  var h='';
  for(var n=3;n<=FREE_MAX;n++)h+='<button type="button" class="chip'+(n===S.n?' sel':'')+'" data-n="'+n+'" aria-pressed="'+(n===S.n)+'">'+n+'</button>';
  PAID.forEach(function(n){h+='<button type="button" class="chip locked" data-paid="'+n+'" aria-label="'+n+' მოთამაშე — ფასიანი">'+n+' 🔒</button>'});
  cnt.innerHTML=h;
  $$('#grpCount .chip[data-n]').forEach(function(b){b.onclick=function(){S.n=+b.dataset.n;paid.hidden=true;drawCounts();drawNames();drawAns()}});
  $$('#grpCount .chip[data-paid]').forEach(function(b){b.onclick=function(){
    paid.hidden=false;
    paid.innerHTML='🔒 <b>'+b.dataset.paid+' მოთამაშით თამაში ფასიანია.</b> 3–4 მოთამაშე უფასოა. 5, 6, 7 და 8 მოთამაშის რეჟიმი ფასიანი გახდება — გადახდა ჯერ არ არის ჩართული.';
  }});
}
function drawNames(){
  var h='';
  for(var i=0;i<S.n;i++)h+='<label>მოთამაშე '+(i+1)+'<input class="grp-name" data-i="'+i+'" maxlength="20" autocomplete="off" placeholder="სახელი" value="'+esc(S.names[i]||'')+'"></label>';
  names.innerHTML=h;
  $$('#grpNames .grp-name').forEach(function(inp){inp.oninput=function(){S.names[+inp.dataset.i]=inp.value;drawAns()}});
}
function nm(i){var v=(S.names[i]||'').trim();return v||('მოთამაშე '+(i+1))}
function drawAns(){
  if(S.ans>=S.n)S.ans=0;
  ansBox.innerHTML=Array.apply(null,{length:S.n}).map(function(_,i){
    return '<button type="button" role="radio" aria-checked="'+(i===S.ans)+'" class="chip'+(i===S.ans?' sel':'')+'" data-a="'+i+'">'+esc(nm(i))+'</button>';
  }).join('');
  $$('#grpAns .chip').forEach(function(b){b.onclick=function(){S.ans=+b.dataset.a;drawAns()}});
  syncOrder();
}
function syncOrder(){
  var o=ord.options,a=nm(S.ans);
  o[0].textContent='ერთი ადამიანი პასუხობს მთელი თამაშის განმავლობაში';
  o[1].textContent='მონაცვლეობით — ყოველ კითხვაზე სხვა პასუხობს';
  o[2].textContent='საკუთარი თანმიმდევრობა…';
  var duel=isDuel();
  $('#grpOrderBox').hidden=duel;$('#grpDuelNote').hidden=!duel;
  $('#grpOrdNLab').hidden=ord.value!=='own';
  $('#grpAnsH').textContent=ord.value==='fix'?'ვინ პასუხობს კითხვებზე?':'ვინ იწყებს პასუხით?';
  $('#grpAnsNote').textContent=ord.value==='fix'?a+' უპასუხებს საკუთარ თავზე, დანარჩენები ('+(S.n-1)+') გამოიცნობენ.':
    a+' იწყებს; შემდეგ პასუხის გამცემი იცვლება ყოველ '+(ord.value==='own'?(Math.max(1,Math.floor(+ordN.value)||1)+' კითხვაზე'):'კითხვაზე')+', ყველა რიგრიგობით. ქულებს ყველა იღებს, როცა გამომცნობია.';
}
ord.onchange=syncOrder;
ordN.oninput=syncOrder;
ordN.onchange=function(){var v=Math.floor(+ordN.value);if(!(v>=1))v=1;if(v>NMAX)v=NMAX;ordN.value=v;syncOrder()};

/* question count: list + own number */
function maxQ(){var n=pool(S.cat).length;return S.cat===MIX?Math.min(n,MIXMAX):n}
function fillQn(){
  var n=maxQ(),o=[5,10,15,20,30,50].filter(function(x){return x<n});if(o.indexOf(n)<0)o.push(n);
  var keep=o.indexOf(10)>-1?10:o[0];
  qn.innerHTML=o.map(function(x){return '<option'+(x===keep?' selected':'')+'>'+x+'</option>'}).join('');
  if(ownQn.value.trim()!=='')applyOwnQn(true);
}
function applyOwnQn(final){
  var raw=ownQn.value.trim();qnHint.textContent='';if(raw==='')return;
  var n=parseInt(raw,10);if(isNaN(n)){if(final)ownQn.value='';return}
  var max=maxQ(),msg='';
  if(!final)return;
  if(n<CMIN){n=CMIN;msg='მინიმუმ '+CMIN+' კითხვა.'}
  if(n>max){n=max;msg='ამ კატეგორიაში მაქსიმუმ '+max+' კითხვაა.'}
  ownQn.value=n;qnHint.textContent=msg;
}
ownQn.onchange=function(){applyOwnQn(true)};
qn.onchange=function(){ownQn.value='';qnHint.textContent=''};
function chosenCount(){applyOwnQn(true);var o=parseInt(ownQn.value,10);return o>=CMIN?o:+qn.value}

/* timer: shares the stored value with the 2-player window */
function setTm(n){
  var hit=[].filter.call(tm.options,function(o){return +o.value===n&&!o.dataset.own})[0];
  [].forEach.call(tm.options,function(o){if(o.dataset.own)o.remove()});
  if(hit){tm.value=String(n);ownTm.value='';return}
  var o=document.createElement('option');o.value=String(n);o.textContent=n+' წამი';o.dataset.own='1';tm.appendChild(o);tm.value=String(n);ownTm.value=n;
}
function applyOwnTm(final){
  var raw=ownTm.value.trim();tmHint.textContent='';if(raw==='')return;
  var n=parseInt(raw,10);if(isNaN(n)){if(final)ownTm.value='';return}
  var msg='';
  if(!final){if(n>=TMIN&&n<=TMAX){setTm(n);ownTm.value=raw;lsSet('pawplay_timer',String(n))}return}
  if(n<TMIN){n=TMIN;msg='მინიმუმ '+TMIN+' წამი.'}if(n>TMAX){n=TMAX;msg='მაქსიმუმ '+TMAX+' წამი.'}
  setTm(n);lsSet('pawplay_timer',String(n));tmHint.textContent=msg;
}
ownTm.oninput=function(){applyOwnTm(false)};ownTm.onchange=function(){applyOwnTm(true)};
tm.onchange=function(){ownTm.value='';tmHint.textContent='';[].forEach.call(tm.options,function(o){if(o.dataset.own&&o.value!==tm.value)o.remove()});lsSet('pawplay_timer',tm.value)};

/* sound / history: same switches as the 2-player window */
gSnd.onchange=function(){var o=$('#optSnd');if(o){o.checked=gSnd.checked;if(o.onchange)o.onchange()}else lsSet('pawplay_snd',gSnd.checked?'1':'0')};
gHist.onchange=function(){var o=$('#optHist');if(o){o.checked=gHist.checked;if(o.onchange)o.onchange()}else lsSet('pawplay_hist',gHist.checked?'1':'0')};

function openGroup(){
  drawCats();drawCounts();drawNames();drawAns();fillQn();paid.hidden=true;
  var t=parseInt(lsGet('pawplay_timer','0'),10);setTm(isNaN(t)?0:t);if(!(t>=TMIN))ownTm.value='';
  var os=$('#optSnd'),oh=$('#optHist');gSnd.checked=os?os.checked:lsGet('pawplay_snd','1')==='1';gHist.checked=oh?oh.checked:lsGet('pawplay_hist','1')==='1';
  syncOrder();closeModal('gameModal');openModal('groupModal');
}
$('#grpBtn').onclick=openGroup;
$('#grpClose').onclick=function(){closeModal('groupModal')};
gr.onclick=function(e){if(e.target===gr)closeModal('groupModal')};

/* ---------- sound ---------- */
var AC=null;
function sndOn(){return !!gSnd.checked||($('#optSnd')&&$('#optSnd').checked)}
function play(kind){
  var o=$('#optSnd');if(o?!o.checked:!gSnd.checked)return;
  var S1={ok:[[660,.12,0],[880,.18,.11]],no:[[220,.25,0]],win:[[523,.14,0],[659,.14,.13],[784,.14,.26],[1046,.34,.39]],tick:[[1000,.05,0]]}[kind];if(!S1)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
    S1.forEach(function(x){var os=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+x[2];os.type=kind==='no'?'triangle':'sine';os.frequency.value=x[0];g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(kind==='tick'?.05:.12,t+.02);g.gain.exponentialRampToValueAtTime(0.0001,t+x[1]);os.connect(g);g.connect(AC.destination);os.start(t);os.stop(t+x[1]+.05)});
    if(navigator.vibrate&&kind!=='tick')navigator.vibrate(kind==='win'?[40,60,40,60,140]:kind==='ok'?[30]:[70]);
  }catch(e){}
}

/* ---------- the game ---------- */
var GG=null,tInt=null;
function ansOf(i){
  if(GG.mode==='fix')return GG.ans;
  var n=GG.p.length,blk=GG.mode==='own'?GG.blk:1;
  return (GG.ans+Math.floor(i/blk))%n;
}
function others(a){var o=[];for(var i=0;i<GG.p.length;i++)if(i!==a)o.push(i);return o}
function stopT(){clearInterval(tInt);tInt=null}

$('#grpStart').onclick=function(){
  var p=[];
  for(var i=0;i<S.n;i++){var v=(S.names[i]||'').trim();if(!v){var f=$$('#grpNames .grp-name')[i];if(f)f.focus();return toast('ჩაწერე ყველა მოთამაშის სახელი.')}p.push(v)}
  var low=p.map(function(x){return x.toLowerCase()});
  if(low.some(function(x,i){return low.indexOf(x)!==i}))return toast('სახელები განსხვავებული უნდა იყოს.');
  var qs=shuffle(pool(S.cat)).slice(0,chosenCount());
  if(qs.length<1)return toast('ამ კატეგორიაში კითხვები არ არის.');
  applyOwnTm(true);
  var secs=+tm.value||0,duel=isDuel();
  GG={p:p,ans:duel?0:S.ans,qs:qs,i:0,duel:duel,mode:duel?'duel':ord.value,blk:Math.max(1,Math.floor(+ordN.value)||1),secs:secs,
      ph:'answer',a:'',g:[],gi:0,j:[],w:null,r:[],t:0,sc:p.map(function(){return 0}),saved:false};
  try{G=null}catch(e){}
  ['undoBtn','pauseBtn','favBtn'].forEach(function(id){var b=$('#'+id);if(b)b.hidden=true});
  window.pawPaused=false;
  $('#demoTitle').textContent=p.join(' × ');
  closeModal('groupModal');openModal('demoModal');drawG();
};
function scoreLine(A){
  var ids=GG.duel?GG.p.map(function(_,i){return i}):(GG.mode==='fix'?others(GG.ans):GG.p.map(function(_,i){return i}));
  return ids.map(function(k){return '<span>'+esc(GG.p[k])+' '+GG.sc[k]+'</span>'}).join('');
}
function addTimer(){
  stopT();
  if(!GG.secs)return;
  var bar=document.createElement('div');bar.id='tmBar';bar.className='tm';bar.setAttribute('aria-hidden','true');bar.innerHTML='<span></span><b></b>';
  var meta=$('#gBody .demo-meta');if(meta)meta.insertAdjacentElement('afterend',bar);else return;
  var end=Date.now()+GG.secs*1000,last=-1,demo=$('#demoModal');
  function tick(){
    if(!demo.classList.contains('show')||!document.body.contains(bar)){stopT();return}
    if($('#leaveBox'))end+=200;
    var left=Math.max(0,end-Date.now()),s=Math.ceil(left/1000);
    bar.firstChild.style.width=(left/(GG.secs*1000)*100)+'%';bar.lastChild.textContent=s+' წ';
    if(s<=3&&s>0&&s!==last){last=s;play('tick')}
    if(left<=0){stopT();var i=$('#ggIn');if(!i)return;if(!i.value.trim())i.value='⏱ დრო ამოიწურა';var ok=$('#ggOk');if(ok)ok.click()}
  }
  tick();tInt=setInterval(tick,200);
}
function drawG(){
  stopT();
  var b=$('#gBody'),n=GG.qs.length;
  if(GG.i>=n)return resultG(b);
  var q=GG.qs[GG.i],A=ansOf(GG.i),pa=esc(GG.p[A]);
  $('#demoProgress').style.width=(GG.i/n*100)+'%';
  var head='<div class="demo-meta"><span>კითხვა '+(GG.i+1)+' / '+n+'</span><span class="grp-score">'+scoreLine(A)+'</span></div>';
  var next=function(){GG.i++;GG.ph='answer';GG.a='';GG.g=[];GG.gi=0;GG.j=[];GG.r=[];GG.t=0;drawG()};
  function focusIn(){var i=$('#ggIn');if(i){i.focus();i.onkeydown=function(e){if(e.key==='Enter'){var ok=$('#ggOk');if(ok)ok.click()}}}}

  /* ----- duel: everybody answers in turn, the group picks the winner ----- */
  if(GG.duel){
    var tk=GG.t,pt=esc(GG.p[tk]);
    if(GG.ph==='answer'||GG.ph==='guess'){
      if(GG.ph==='answer'&&tk>0){GG.ph='pass'}
    }
    if(GG.ph==='pass'){
      b.innerHTML=head+'<div class="pass">📱</div><h3>გადაეცი მოწყობილობა: '+pt+'</h3><p class="modal-sub">წინა მოთამაშეების პასუხები დამალულია.</p><button class="btn btn-primary full" id="ggOk" type="button">მზად ვარ →</button>';
      $('#ggOk').onclick=function(){GG.ph='guess';drawG()};return;
    }
    if(GG.ph==='answer'||GG.ph==='guess'){
      b.innerHTML=head+'<p class="g-who">'+pt+'-ს რიგია <small>('+(tk+1)+'/'+GG.p.length+')</small></p><h3>'+esc(q.t)+'</h3><input id="ggIn" class="masked" autocomplete="off" placeholder="შენი პასუხი — სხვები ვერ დაინახავენ..."><div class="demo-actions"><button class="btn btn-primary full" id="ggOk" type="button">დადასტურება →</button></div>';
      $('#ggOk').onclick=function(){
        var v=$('#ggIn').value.trim();if(!v)return toast('ჩაწერე პასუხი.');
        GG.r[tk]=v;GG.t++;GG.ph=GG.t<GG.p.length?'pass':'reveal';drawG();
      };
      focusIn();if(tk>0)addTimer();return;
    }
    var rows=GG.p.map(function(name,k){return '<div class="grp-row"><div><small>'+esc(name)+'</small><b>'+esc(GG.r[k])+'</b></div><div class="grp-judge"><button type="button" class="btn btn-primary" data-w="'+k+'" aria-label="'+esc(name)+' იგებს">🏆</button></div></div>'}).join('');
    b.innerHTML=head+'<h3>'+esc(q.t)+'</h3>'+rows+'<p class="note">ერთად გადაწყვიტეთ, ვისი პასუხი იყო უკეთესი, და დააჭირეთ 🏆-ს.</p><div class="demo-actions"><button class="btn btn-ghost full" id="ggTie" type="button">ფრე — ქულა არავის</button></div>';
    $$('#gBody [data-w]').forEach(function(x){x.onclick=function(){GG.sc[+x.dataset.w]++;play('ok');next()}});
    $('#ggTie').onclick=next;return;
  }

  /* ----- normal: one answers, the others guess ----- */
  var gs=others(A);
  if(GG.ph==='answer'){
    b.innerHTML=head+'<p class="g-who">'+pa+', უპასუხე შენს შესახებ</p><h3>'+esc(q.t)+'</h3><input id="ggIn" class="masked" autocomplete="off" placeholder="ჩაწერე პასუხი — სხვები ვერ დაინახავენ"><div class="demo-actions"><button class="btn btn-ghost" id="ggSkip" type="button">გამოტოვება</button><button class="btn btn-primary" id="ggOk" type="button">შემდეგი →</button></div>';
    $('#ggSkip').onclick=next;
    $('#ggOk').onclick=function(){var v=$('#ggIn').value.trim();if(!v)return toast('ჩაწერე პასუხი ან გამოტოვე.');GG.a=v;GG.ph='pass';drawG()};
    return focusIn();
  }
  var k=gs[GG.gi],pk=esc(GG.p[k]);
  if(GG.ph==='pass'){
    b.innerHTML=head+'<div class="pass">📱</div><h3>გადაეცი მოწყობილობა: '+pk+'</h3><p class="modal-sub">'+pa+'-ის პასუხი დამალულია'+(GG.gi?', სხვების ვარაუდიც':'')+'.</p><button class="btn btn-primary full" id="ggOk" type="button">მზად ვარ →</button>';
    $('#ggOk').onclick=function(){GG.ph='guess';drawG()};return;
  }
  if(GG.ph==='guess'){
    b.innerHTML=head+'<p class="g-who">'+pk+', გამოიცანი, რას უპასუხებდა '+pa+' <small>('+(GG.gi+1)+'/'+gs.length+')</small></p><h3>'+esc(q.t)+'</h3><input id="ggIn" class="masked" autocomplete="off" placeholder="შენი ვარაუდი — სხვები ვერ დაინახავენ..."><div class="demo-actions"><button class="btn btn-primary full" id="ggOk" type="button">დადასტურება →</button></div>';
    $('#ggOk').onclick=function(){
      var v=$('#ggIn').value.trim();if(!v)return toast('ჩაწერე ვარაუდი.');
      GG.g[GG.gi]=v;GG.gi++;
      if(GG.gi<gs.length){GG.ph='pass'}else{
        GG.j=gs.map(function(kk,idx){return same(GG.a,GG.g[idx],q.acc)});
        GG.ph='reveal';
      }
      drawG();
    };
    focusIn();addTimer();return;
  }
  var rows2=gs.map(function(kk,idx){
    var auto=same(GG.a,GG.g[idx],q.acc);
    return '<div class="grp-row"><div><small>'+esc(GG.p[kk])+' გამოიცნო'+(auto?' · ✓ ემთხვევა':'')+'</small><b>'+esc(GG.g[idx])+'</b></div><div class="grp-judge"><button type="button" class="btn '+(GG.j[idx]?'btn-ghost':'btn-primary')+'" data-j="'+idx+'" data-v="0" aria-label="ვერ გამოიცნო">✗</button><button type="button" class="btn '+(GG.j[idx]?'btn-primary':'btn-ghost')+'" data-j="'+idx+'" data-v="1" aria-label="გამოიცნო">✓</button></div></div>';
  }).join('');
  b.innerHTML=head+'<h3>'+esc(q.t)+'</h3><div class="grp-ansbox"><small>'+pa+' უპასუხა</small><b>'+esc(GG.a)+'</b></div>'+rows2+'<p class="note">სისტემა წინასწარ მონიშნავს ემთხვევა თუ არა. საბოლოოდ წყვეტს '+pa+' — შეგიძლია შეცვალო.</p><div class="demo-actions"><button class="btn btn-primary full" id="ggOk" type="button">შემდეგი →</button></div>';
  $$('#gBody .grp-judge button').forEach(function(btn){btn.onclick=function(){var idx=+btn.dataset.j;GG.j[idx]=btn.dataset.v==='1';var y=$$('#gBody .grp-judge')[idx];
    y.children[0].className='btn '+(GG.j[idx]?'btn-ghost':'btn-primary');y.children[1].className='btn '+(GG.j[idx]?'btn-primary':'btn-ghost')}});
  $('#ggOk').onclick=function(){var any=false;gs.forEach(function(kk,idx){if(GG.j[idx]){GG.sc[kk]++;any=true}});play(any?'ok':'no');next()};
}
function resultG(b){
  stopT();$('#demoProgress').style.width='100%';
  var ids=GG.duel||GG.mode!=='fix'?GG.p.map(function(_,i){return i}):others(GG.ans);
  ids.sort(function(x,y){return GG.sc[y]-GG.sc[x]});
  var top=GG.sc[ids[0]],win=ids.filter(function(k){return GG.sc[k]===top}),all=win.length===ids.length;
  var who=GG.duel?'':(GG.mode==='fix'?esc(GG.p[GG.ans])+'-ს':'ერთმანეთს');
  var title=all?(GG.duel?'ფრე! ყველა ერთნაირად კარგი იყავით':'ფრე! ყველა ერთნაირად იცნობთ '+who):win.length>1?'გამარჯვებულები: '+win.map(function(k){return esc(GG.p[k])}).join(', '):esc(GG.p[win[0]])+' იგებს!';
  var board=ids.map(function(k){return '<div class="'+(win.indexOf(k)>-1?'win':'')+'"><b>'+GG.sc[k]+'</b><small>'+esc(GG.p[k])+'</small></div>'}).join('');
  var note=GG.duel?'ჯამში '+GG.qs.length+' კითხვა.':GG.mode==='fix'?esc(GG.p[GG.ans])+' იყო პასუხის გამცემი — ქულებს ის არ იღებს. ჯამში '+GG.qs.length+' კითხვა.':'ქულა ეძლევა გამოცნობისთვის. ჯამში '+GG.qs.length+' კითხვა.';
  b.innerHTML='<div class="pass">🏆</div><h3>'+title+'</h3><div class="grp-board">'+board+'</div><p class="note">'+note+'</p><div class="demo-actions"><button class="btn btn-ghost" id="ggShare" type="button">გაზიარება</button><button class="btn btn-primary" id="gAgain" type="button">ახალი თამაში</button></div>';
  var txt='Pawplay: '+ids.map(function(k){return GG.p[k]+' '+GG.sc[k]}).join(' · ')+(GG.duel?' — ვის პასუხი იყო უკეთესი?':GG.mode==='fix'?' — ვინ უკეთ იცნობს '+GG.p[GG.ans]+'-ს?':' — ვინ ვის უკეთ იცნობს?');
  $('#ggShare').onclick=function(){(navigator.share?navigator.share({text:txt}):navigator.clipboard.writeText(txt).then(function(){toast('ტექსტი დაკოპირდა!')})).catch(function(){})};
  $('#gAgain').onclick=function(){closeModal('demoModal');openGroup()};
  if(!GG.saved){
    GG.saved=true;play('win');
    var oh=$('#optHist');
    if(oh?oh.checked:gHist.checked){
      try{
        var a=JSON.parse(lsGet('pawplay_history','[]'));if(!Array.isArray(a))a=[];
        a.push({t:Date.now(),p:GG.p.slice(),s:GG.sc.slice(),d:!!GG.duel,g:1,w:all?'ფრე':win.map(function(k){return GG.p[k]}).join(', ')});
        lsSet('pawplay_history',JSON.stringify(a.slice(-100)));
        if(window.pawRenderHist)window.pawRenderHist();
      }catch(e){}
    }
  }
}

/* ---------- FAQ line ---------- */
(function(){
  var f=$('.faq');if(!f)return;
  f.insertAdjacentHTML('beforeend','<details><summary>შეიძლება თუ არა 2-ზე მეტი მოთამაშე?</summary><p>დიახ, 3–4 მოთამაშით უფასოდ. ერთი ადამიანი პასუხობს საკუთარ თავზე, დანარჩენები ცდილობენ გამოცნობას; პასუხის გამცემი მთელი თამაშის განმავლობაში ერთია, ან იცვლება. 5–8 მოთამაშე ფასიანი რეჟიმი იქნება (გადახდა ჯერ არ არის ჩართული).</p></details>');
})();
})();
