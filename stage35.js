/* Pawplay stage 35: Google sign-in (Firebase Auth) + cross-device sync of favourites, custom questions and history.
   Additive; loaded after stage30.js. Does nothing unless config.js holds a full Firebase config (apiKey + databaseURL).
   Data lives at users/{uid}/data (client-writable by the owner only) and users/{uid}/plan (read-only for clients). */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var FB=window.PAWPLAY_FIREBASE;
if(!FB||!FB.apiKey||!FB.databaseURL||!$('#menuBtn'))return;
var BASE='https://www.gstatic.com/firebasejs/10.12.2/';
var KEYS={custom:'pawplay_custom',favs:'pawplay_favs',hist:'pawplay_history'},CAP={custom:300,favs:100,hist:100};
var TS='pawplay_sync_ts',UID='pawplay_sync_uid',DIRTY='pawplay_sync_dirty';
var realSet=Storage.prototype.setItem,auth=null,db=null,user=null,applying=false,upT=null;
function lsGet(k,d){try{var v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}}
function lsPut(k,v){try{realSet.call(localStorage,k,v)}catch(e){}}
function parse(s){try{var a=JSON.parse(s);return Array.isArray(a)?a:[]}catch(e){return[]}}
function say(t){if(typeof toast==='function')toast(t)}

/* any local change to the three synced keys schedules an upload (when signed in) */
Storage.prototype.setItem=function(k,v){
  realSet.call(this,k,v);
  if(this===window.localStorage&&!applying&&user){
    for(var n in KEYS)if(KEYS[n]===k){lsPut(DIRTY,'1');clearTimeout(upT);upT=setTimeout(upload,1500);break}
  }
};

/* ---------- UI ---------- */
var btn=document.createElement('button');btn.id='authBtn';btn.type='button';btn.className='auth-btn';btn.hidden=true;
$('#menuBtn').insertAdjacentElement('beforebegin',btn);
var menu=document.createElement('div');menu.id='authMenu';menu.className='auth-menu';menu.hidden=true;
menu.innerHTML='<div class="am-mail" id="amMail"></div><button type="button" class="btn btn-ghost" id="amOut">გამოსვლა</button><button type="button" class="btn btn-ghost am-del" id="amDel">ანგარიშის წაშლა</button><small class="am-note">ანგარიშის წაშლა შლის ღრუბელში შენახულ ფავორიტებს, კითხვებსა და ისტორიას. ამ მოწყობილობის ასლი რჩება.</small>';
$('.topbar').appendChild(menu);
function render(){
  btn.hidden=false;btn.textContent='';
  if(!user){btn.className='auth-btn';btn.textContent='Google-ით შესვლა';btn.setAttribute('aria-label','Google-ით შესვლა');menu.hidden=true;return}
  btn.className='auth-btn on';
  if(user.photoURL){var im=document.createElement('img');im.src=user.photoURL;im.alt='';im.referrerPolicy='no-referrer';im.width=22;im.height=22;btn.appendChild(im)}
  var sp=document.createElement('span');sp.textContent=((user.displayName||user.email||'ანგარიში').split(' ')[0]).slice(0,14);btn.appendChild(sp);
  btn.setAttribute('aria-label','ანგარიში: '+(user.email||user.displayName||''));
  $('#amMail').textContent=user.email||user.displayName||'';
}
btn.onclick=function(){if(!auth)return;if(user)menu.hidden=!menu.hidden;else signIn()};
document.addEventListener('click',function(e){if(!menu.hidden&&!menu.contains(e.target)&&e.target!==btn&&!btn.contains(e.target))menu.hidden=true});
document.addEventListener('keydown',function(e){if(e.key==='Escape')menu.hidden=true});
$('#amOut').onclick=function(){menu.hidden=true;upload(true);setTimeout(function(){auth.signOut()},300)};
var dt=null;
$('#amDel').onclick=function(){
  var b=$('#amDel');
  if(!b.dataset.sure){b.dataset.sure='1';b.textContent='დარწმუნებული ხარ? დააჭირე კიდევ ერთხელ';dt=setTimeout(function(){b.dataset.sure='';b.textContent='ანგარიშის წაშლა'},3500);return}
  clearTimeout(dt);b.dataset.sure='';b.textContent='ანგარიშის წაშლა';menu.hidden=true;removeAccount();
};

/* ---------- auth ---------- */
function signIn(){
  var pr=new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(pr).catch(function(e){
    var c=e&&e.code;
    if(c==='auth/popup-blocked'||c==='auth/operation-not-supported-in-this-environment')return auth.signInWithRedirect(pr);
    if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request')return;
    say('შესვლა ვერ მოხერხდა.');
  });
}
function removeAccount(){
  var u=user;if(!u)return;
  var done=function(){lsPut(UID,'');lsPut(TS,'0');lsPut(DIRTY,'0');say('ანგარიში წაიშალა.')};
  db.ref('users/'+u.uid+'/data').remove().catch(function(){}).then(function(){
    return u.delete().then(done).catch(function(e){
      if(e&&e.code==='auth/requires-recent-login')return u.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider()).then(function(){return u.delete()}).then(done);
      throw e;
    });
  }).catch(function(){say('ანგარიშის წაშლა ვერ მოხერხდა. გამოდი, თავიდან შედი და სცადე ისევ.')});
}

/* ---------- sync ---------- */
function ref(){return db.ref('users/'+user.uid+'/data')}
function pack(){var d={ts:Date.now()};for(var n in KEYS)d[n]=lsGet(KEYS[n],'[]');return d}
function upload(){
  if(!user||!db)return;clearTimeout(upT);
  var d=pack();
  ref().set(d).then(function(){lsPut(TS,String(d.ts));lsPut(UID,user.uid);lsPut(DIRTY,'0')}).catch(function(){});
}
var idf={custom:function(q){return q.category+'|'+q.text},favs:function(f){return f.t},hist:function(r){return r.t+'|'+(r.p||[]).join(',')}};
function union(a,b,k){
  var seen={},out=[];a.concat(b).forEach(function(x){if(!x)return;var i=idf[k](x);if(!seen[i]){seen[i]=1;out.push(x)}});
  if(k==='hist')out.sort(function(x,y){return (x.t||0)-(y.t||0)});
  return k==='hist'?out.slice(-CAP[k]):out.slice(0,CAP[k]);
}
function gameOpen(){var m=$('#demoModal');return m&&m.classList.contains('show')}
function apply(obj,ts){
  var changed=false;applying=true;
  for(var n in KEYS){var s=typeof obj[n]==='string'?obj[n]:'[]';if(s!==lsGet(KEYS[n],'[]')){lsPut(KEYS[n],s);changed=true}}
  applying=false;lsPut(UID,user.uid);lsPut(TS,String(ts));lsPut(DIRTY,'0');
  if(changed){if(gameOpen())say('მონაცემები განახლდა; ცვლილება გვერდის განახლების შემდეგ გამოჩნდება.');else location.reload()}
}
function pull(){
  ref().once('value').then(function(s){
    var c=s.val(),other=lsGet(UID,'')&&lsGet(UID,'')!==user.uid,dirty=lsGet(DIRTY,'0')==='1',lts=+lsGet(TS,'0')||0;
    if(other){ /* this device still holds another account's data: never mix it into this account */
      if(c)apply(c,c.ts||Date.now());else{applying=true;for(var n in KEYS)lsPut(KEYS[n],'[]');applying=false;lsPut(UID,user.uid);lsPut(TS,'0');lsPut(DIRTY,'0');if(!gameOpen())location.reload()}
      return;
    }
    if(!c){upload();return}
    if(!lsGet(UID,'')||dirty){ /* first sign-in on this device (or unsynced offline edits): union, nothing is lost */
      var m={};for(var k in KEYS)m[k]=JSON.stringify(union(parse(lsGet(KEYS[k],'[]')),parse(c[k]),k));
      applying=true;var changed=false;
      for(var j in KEYS)if(m[j]!==lsGet(KEYS[j],'[]')){lsPut(KEYS[j],m[j]);changed=true}
      applying=false;lsPut(UID,user.uid);
      var d=pack();
      ref().set(d).then(function(){lsPut(TS,String(d.ts));lsPut(DIRTY,'0');if(changed){if(gameOpen())say('მონაცემები გაერთიანდა.');else location.reload()}}).catch(function(){});
      return;
    }
    if((c.ts||0)>lts)apply(c,c.ts);
  }).catch(function(){});
  db.ref('users/'+user.uid+'/plan').once('value').then(function(s){window.pawUser={uid:user.uid,plan:s.val()||'free'}}).catch(function(){window.pawUser={uid:user.uid,plan:'free'}});
}

/* ---------- boot (after the page has loaded, so it never slows the first screen) ---------- */
function L(s){return new Promise(function(r,j){var e=document.createElement('script');e.src=s;e.onload=r;e.onerror=j;document.head.appendChild(e)})}
function need(t,f){return(typeof firebase!=='undefined'&&typeof firebase[t]==='function')?Promise.resolve():L(BASE+f)}
function boot(){
  need('initializeApp','firebase-app-compat.js').then(function(){return need('auth','firebase-auth-compat.js')}).then(function(){return need('database','firebase-database-compat.js')}).then(function(){
    if(!firebase.apps.length)firebase.initializeApp(FB);
    auth=firebase.auth();db=firebase.database();
    auth.onAuthStateChanged(function(u){user=u||null;window.pawUser=u?{uid:u.uid,plan:'free'}:null;render();if(u)pull()});
  }).catch(function(){btn.hidden=true});
}
if(document.readyState==='complete')setTimeout(boot,0);else window.addEventListener('load',function(){setTimeout(boot,0)});

/* ---------- FAQ line ---------- */
(function(){
  var f=$('.faq');if(!f)return;
  f.insertAdjacentHTML('beforeend','<details><summary>რისთვის მჭირდება Google-ით შესვლა?</summary><p>შესვლა არჩევითია, თამაში მის გარეშეც მუშაობს. შესვლის შემდეგ ფავორიტები, საკუთარი კითხვები და შედეგების ისტორია ინახება შენს ანგარიშზე და ჩანს სხვა მოწყობილობაზეც. თამაშის პასუხები ანგარიშზე არ ინახება. ანგარიშის წაშლა ნებისმიერ დროს შეგიძლია ზედა მენიუდან.</p></details>');
})();
})();
