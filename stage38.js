/* Pawplay stage 38: game name (profile) for signed-in players.
   - Name (max 18) + optional tag/initials (max 8), stored at users/{uid}/profile (owner-only).
   - Shown in the account menu; changeable at any time.
   - Online rooms (create / join) always use the profile name when signed in.
   - Two players with identical names in one room: the joiner gets " (2)" (see app.js).
   Additive; loaded after stage35.js, which fires the 'pawauth' event. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var FB=window.PAWPLAY_FIREBASE;
if(!FB||!FB.apiKey||!FB.databaseURL||!$('#authMenu'))return;
var user=null,prof=null,asked=false,MAXN=18,MAXG=8;
function say(t){if(typeof toast==='function')toast(t)}
function clean(s,max){return String(s==null?'':s).replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,max)}
function disp(p){return p.n+(p.g?' ('+p.g+')':'')}
function path(){return 'users/'+user.uid+'/profile'}

/* ---------- account menu ---------- */
var menu=$('#authMenu');
var nick=document.createElement('div');nick.className='am-nick';nick.id='amNick';nick.hidden=true;
var nickBtn=document.createElement('button');nickBtn.type='button';nickBtn.className='btn btn-ghost';nickBtn.id='amNickBtn';nickBtn.textContent='თამაშის სახელი';
var mail=$('#amMail');mail.insertAdjacentElement('afterend',nickBtn);mail.insertAdjacentElement('afterend',nick);
nickBtn.onclick=function(){menu.hidden=true;openProf()};

/* ---------- hint inside the game window (online box) ---------- */
var hint=document.createElement('small');hint.className='note prof-hint';hint.id='profHint';
var ob=$('#onlineBox');if(ob)ob.appendChild(hint);
function drawHint(){
  if(!hint)return;
  hint.textContent='';
  if(user&&prof){
    hint.appendChild(document.createTextNode('ონლაინ ოთახში შეხვალ სახელით: '));
    var b=document.createElement('b');b.textContent=disp(prof);hint.appendChild(b);
    hint.appendChild(document.createTextNode(' · '));
    var a=document.createElement('button');a.type='button';a.className='prof-link';a.textContent='შეცვლა';a.onclick=openProf;hint.appendChild(a);
  }else if(user){
    var a2=document.createElement('button');a2.type='button';a2.className='prof-link';a2.textContent='აირჩიე თამაშის სახელი';a2.onclick=openProf;hint.appendChild(a2);
  }else{
    hint.textContent='ონლაინ ოთახში შეხვალ ზემოთ ჩაწერილი სახელით. Google-ით შესვლის შემდეგ შეგიძლია მუდმივი სახელი აირჩიო.';
  }
}
function drawMenu(){
  if(user&&prof){nick.hidden=false;nick.textContent='თამაშის სახელი: '+disp(prof)}
  else if(user){nick.hidden=false;nick.textContent='თამაშის სახელი ჯერ არ გაქვს არჩეული'}
  else nick.hidden=true;
  nickBtn.textContent=prof?'სახელის შეცვლა':'სახელის არჩევა';
}
function refresh(){drawMenu();drawHint()}

/* ---------- the modal ---------- */
var m=document.createElement('div');m.className='modal-backdrop prof-modal';m.id='profModal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-labelledby','profTitle');
m.innerHTML='<div class="modal"><button type="button" class="close" id="profX" aria-label="დახურვა">×</button><div class="eyebrow">პროფილი</div><h2 id="profTitle">თამაშის სახელი</h2><p class="modal-sub">ამ სახელით შემოხვალ ონლაინ ოთახებში. ნებისმიერ დროს შეგიძლია შეცვალო.</p>'
+'<label>სახელი<input id="profN" maxlength="'+MAXN+'" autocomplete="off" placeholder="მაგ. თორნიკე"></label>'
+'<label>ინიციალი ან ნიშანი <small>(არჩევითი: სახელის გამოსარჩევად, თუ სხვასაც იგივე სახელი აქვს)</small><input id="profG" maxlength="'+MAXG+'" autocomplete="off" placeholder="მაგ. კ.გ."></label>'
+'<div class="prof-prev">ოთახში გამოჩნდები როგორც: <b id="profPrev">…</b></div>'
+'<button type="button" class="btn btn-primary full" id="profOk">შენახვა</button></div>';
document.body.appendChild(m);
var iN=$('#profN'),iG=$('#profG'),pv=$('#profPrev'),ok=$('#profOk');
function preview(){var n=clean(iN.value,MAXN),g=clean(iG.value,MAXG);pv.textContent=n?disp({n:n,g:g}):'…'}
iN.oninput=iG.oninput=preview;
function openProf(){
  if(!user)return;
  iN.value=prof?prof.n:'';iG.value=prof?prof.g:'';
  if(!prof){var first=clean(((user.name||'').split(' ')[0]),MAXN),typed=clean(($('#playerOne')||{}).value,MAXN);iN.value=typed||first}
  preview();m.classList.add('show');setTimeout(function(){iN.focus();iN.select()},50);
}
function closeProf(){m.classList.remove('show')}
$('#profX').onclick=closeProf;
m.addEventListener('click',function(e){if(e.target===m)closeProf()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&m.classList.contains('show'))closeProf()});
[iN,iG].forEach(function(i){i.onkeydown=function(e){if(e.key==='Enter')ok.click()}});
ok.onclick=function(){
  var n=clean(iN.value,MAXN),g=clean(iG.value,MAXG);
  if(!n)return say('ჩაწერე სახელი.');
  if(!user||typeof firebase==='undefined')return say('ჯერ შედი Google-ით.');
  var v={n:n};if(g)v.g=g;
  ok.disabled=true;
  firebase.database().ref(path()).set(v).then(function(){
    prof={n:n,g:g};ok.disabled=false;closeProf();refresh();fillLocal();say('სახელი შეინახა: '+disp(prof));
  }).catch(function(){ok.disabled=false;say('სახელის შენახვა ვერ მოხერხდა.')});
};

/* ---------- using the name ---------- */
function fillLocal(){var n1=$('#playerOne');if(n1&&prof)n1.value=disp(prof)}
/* before an online room is created or joined, the profile name always wins (capture phase: runs before app.js) */
document.addEventListener('click',function(e){
  var t=e.target&&e.target.closest?e.target.closest('#onlineBtn,#joinBtn'):null;
  if(t&&user&&prof)fillLocal();
},true);

/* ---------- sign-in state (event from stage35.js) ---------- */
document.addEventListener('pawauth',function(e){
  var d=e.detail;
  if(!d){user=null;prof=null;asked=false;refresh();return}
  user=d;prof=null;refresh();
  if(typeof firebase==='undefined')return;
  firebase.database().ref(path()).once('value').then(function(s){
    var v=s.val();
    if(v&&typeof v.n==='string'&&clean(v.n,MAXN)){prof={n:clean(v.n,MAXN),g:clean(v.g,MAXG)};refresh();fillLocal()}
    else{refresh();if(!asked){asked=true;setTimeout(openProf,600)}}
  }).catch(function(){refresh()});
});
refresh();

/* ---------- FAQ line ---------- */
var f=$('.faq');
if(f)f.insertAdjacentHTML('beforeend','<details><summary>როგორ ავირჩიო ან შევცვალო თამაშის სახელი?</summary><p>Google-ით შესვლის შემდეგ ზედა მენიუში აირჩიე „სახელის შეცვლა“. შეგიძლია ინიციალიც დაამატო, მაგალითად „თორნიკე (კ.გ.)“, რომ მეორე თორნიკესგან გაგარჩიონ. ონლაინ ოთახში ყოველთვის ამ სახელით შეხვალ. თუ ორივე მოთამაშეს ზუსტად ერთი და იგივე სახელი აქვს, შემომსვლელს სახელს ბოლოში „(2)“ დაემატება.</p></details>');
})();
