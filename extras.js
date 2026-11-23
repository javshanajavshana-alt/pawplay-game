/* Pawplay stage 13: additive extras. Loaded after app.js. It wraps and extends existing
   behaviour and does not edit any earlier logic. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)},$$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var demo=$('#demoModal');

/* ---------- accessibility: live toast, dialog labels, input limits ---------- */
(function(){
  var t=$('#toast');if(t){t.setAttribute('role','status');t.setAttribute('aria-live','polite')}
  [['gameModal','gameTitle'],['customModal','customTitle']].forEach(function(p){
    var m=$('#'+p[0]),h=m&&m.querySelector('h2');if(h){h.id=p[1];m.setAttribute('aria-labelledby',p[1])}
  });
  var n1=$('#playerOne'),n2=$('#playerTwo'),ct=$('#customText'),ca=$('#acceptedAnswers');
  if(n1)n1.maxLength=20;if(n2)n2.maxLength=20;if(ct)ct.maxLength=200;if(ca)ca.maxLength=200;
})();

/* ---------- focus return + focus trap inside modals ---------- */
var opener=null;
var _open=openModal,_close=closeModal;
openModal=function(id){var m=$('#'+id);if(m&&!m.classList.contains('show'))opener=document.activeElement;_open(id)};
closeModal=function(id){_close(id);if(opener&&opener.focus&&!$('.modal-backdrop.show')){try{opener.focus()}catch(e){}}};
document.addEventListener('keydown',function(e){
  if(e.key!=='Tab')return;
  var m=$('.modal-backdrop.show .modal');if(!m)return;
  var f=[].slice.call(m.querySelectorAll('a[href],button:not([disabled]),input:not([hidden]),select,textarea,[tabindex]:not([tabindex="-1"])')).filter(function(x){return x.offsetParent!==null});
  if(!f.length)return;
  var first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});

/* ---------- confirm before leaving a game in progress ---------- */
function gameActive(){return demo.classList.contains('show')&&!$('#gAgain')}
function leaveOnline(){try{if(typeof roomRef!=='undefined'&&roomRef){roomRef.off();roomRef=null;O=null}}catch(e){}}
function askLeave(){
  if($('#leaveBox'))return;
  var box=document.createElement('div');box.id='leaveBox';box.className='leave-box';box.setAttribute('role','alertdialog');box.setAttribute('aria-label','თამაშიდან გასვლა');
  box.innerHTML='<p>გსურს თამაშიდან გასვლა? მიმდინარე პროგრესი დაიკარგება.</p><div class="demo-actions"><button class="btn btn-ghost" id="leaveStay">დარჩენა</button><button class="btn btn-primary" id="leaveGo">გასვლა</button></div>';
  $('#demoModal .modal').appendChild(box);
  $('#leaveStay').onclick=function(){box.remove()};
  $('#leaveGo').onclick=function(){box.remove();leaveOnline();closeModal('demoModal')};
  $('#leaveStay').focus();
}
function tryClose(){if(gameActive())askLeave();else{leaveOnline();closeModal('demoModal')}}
demo.onclick=function(e){if(e.target===demo)tryClose()};
$$('[data-close="demoModal"]').forEach(function(b){b.onclick=tryClose});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&demo.classList.contains('show')){
    e.stopImmediatePropagation();
    var lb=$('#leaveBox');if(lb)lb.remove();else tryClose();
  }
},true);

/* ---------- history for the end-of-game recap ---------- */
var H=[],pend=null,onlineMode=false;
window.pawResetRecap=function(){H=[];pend=null};window.pawPopRecap=function(){H.pop()};
function resetHistory(on){return function(){H=[];pend=null;onlineMode=on}}
[['createGame',false],['onlineBtn',true],['joinBtn',true]].forEach(function(x){var b=$('#'+x[0]);if(b)b.addEventListener('click',resetHistory(x[1]),true)});
$('#gBody').addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('button');if(onlineMode||!b||typeof G==='undefined'||!G||!G.qs)return;
  var id=b.id;if(['gYes','gNo','gA','gB','gD'].indexOf(id)<0)return;
  var A=window.pawA?pawA(G):G.i%2,q=G.qs[G.i];if(!q)return;
  var v=id==='gYes'?'ok':id==='gNo'?'no':id==='gD'?'D':'W'+(id==='gA'?A:1-A);
  H.push({q:q.t,a:G.a,g:G.g,A:A,p:G.p.slice(),duel:G.duel,v:v});
},true);
function trackOnline(v){
  if(!onlineMode||!v||!v.p||!v.p[1]||!v.qs)return;
  var s=v.s||[0,0];
  if(pend&&v.i>pend.i){
    var d0=s[0]-pend.s[0],d1=s[1]-pend.s[1];
    pend.v=v.duel?(d0>0?'W0':d1>0?'W1':'D'):(d0+d1>0?'ok':'no');
    H.push(pend);pend=null;
  }
  if(v.i<v.qs.length&&v.ph==='reveal'&&(!pend||pend.i!==v.i)){
    pend={i:v.i,q:v.qs[v.i],a:v.a,g:v.g,A:(window.pawAOn?pawAOn(v):v.i%2),p:v.p.slice(),duel:v.duel,s:s.slice()};
  }
}

/* ---------- A-or-B questions become two tap buttons ---------- */
function choicePost(){
  var inp=$('#gIn');if(!inp||inp.dataset.ch)return;
  var h=$('#gBody h3');if(!h)return;
  var m=/^([^?]+?)\s+თუ\s+([^?]+?)\?$/.exec(h.textContent.trim());
  if(!m||/\sთუ\s/.test(m[1]+' '+m[2]))return;
  var o1=m[1].trim(),o2=m[2].trim();
  if(/^(არა|არ)\s/.test(o2)||/^(ვარ|ვინახავ|ვაკეთებ)$/.test(o1))return;
  if(o1.indexOf(':')>-1)o1=o1.slice(o1.indexOf(':')+1).trim();
  if(/^\S+$/.test(o1)&&/^არა(\s|$)/.test(o2)){o1='დიახ';o2='არა'}
  else{var ci=o1.lastIndexOf(':');if(ci>-1)o1=o1.slice(ci+1).trim();if(/,/.test(o1+o2))return}
  if(o1.split(/\s+/).length>5||o2.split(/\s+/).length>6)return;
  inp.dataset.ch='1';
  var row=document.createElement('div');row.className='choice-row';
  [o1,o2].forEach(function(o){
    var b=document.createElement('button');b.type='button';b.className='btn btn-ghost';b.textContent=o;
    b.onclick=function(){inp.value=o;var ok=$('#gOk');if(ok)ok.click()};
    row.appendChild(b);
  });
  inp.parentNode.insertBefore(row,inp);
  var or=document.createElement('span');or.className='choice-or';or.textContent='ან ჩაწერე საკუთარი პასუხი';
  inp.parentNode.insertBefore(or,inp);
}
var _draw=draw;draw=function(){_draw.apply(this,arguments);choicePost()};
if(typeof drawOnline==='function'){var _dOn=drawOnline;drawOnline=function(){try{trackOnline(O)}catch(e){}_dOn.apply(this,arguments);choicePost()}}

/* ---------- result: recap list, share with link, image card ---------- */
var siteUrl=/^https?:$/.test(location.protocol)?location.origin+location.pathname:'';
function shareText(){
  var s=G.s,p=G.p;
  return 'Pawplay: '+p[0]+' '+s[0]+' : '+s[1]+' '+p[1]+' — '+(G.duel?'ვის პასუხი იყო უკეთესი?':'ვინ ვის უკეთ იცნობს?')+(siteUrl?' '+siteUrl:'');
}
function recapHTML(){
  if(!H.length)return '';
  var items=H.map(function(r){
    var res,sub;
    if(r.duel){
      res=r.v==='D'?'<em>=</em>':'<em class="ok">🏆 '+esc(r.p[+r.v.slice(1)])+'</em>';
      sub='<small>'+esc(r.p[r.A])+': '+esc(r.a)+' · '+esc(r.p[1-r.A])+': '+esc(r.g)+'</small>';
    }else{
      res=r.v==='ok'?'<em class="ok">✓ '+esc(r.a)+'</em>':'<em class="no">✗ '+esc(r.a)+' / '+esc(r.g)+'</em>';
      sub='';
    }
    return '<li><span>'+esc(r.q)+sub+'</span>'+res+'</li>';
  }).join('');
  return '<h4 class="recap-title">კითხვები და პასუხები</h4><ul class="sample-list recap">'+items+'</ul>';
}
function drawCard(){
  var W=1080,Hh=1080,c=document.createElement('canvas');c.width=W;c.height=Hh;var x=c.getContext('2d');
  var ff='"Noto Sans Georgian",Manrope,system-ui,sans-serif';
  var g=x.createLinearGradient(0,0,W,Hh);g.addColorStop(0,'#10162f');g.addColorStop(1,'#25306a');x.fillStyle=g;x.fillRect(0,0,W,Hh);
  x.fillStyle='rgba(155,140,255,.18)';x.beginPath();x.arc(W-120,140,260,0,7);x.fill();
  x.fillStyle='rgba(105,197,255,.12)';x.beginPath();x.arc(100,Hh-100,240,0,7);x.fill();
  x.textAlign='center';x.fillStyle='#9b8cff';x.font='800 54px '+ff;x.fillText('pawplay.',W/2,130);
  x.fillStyle='#f5f6ff';x.font='800 58px '+ff;x.fillText(G.duel?'ვის პასუხი იყო უკეთესი?':'ვინ ვის უკეთ იცნობს?',W/2,250);
  var s=G.s,p=G.p,w=s[0]===s[1]?-1:s[0]>s[1]?0:1;
  [0,1].forEach(function(i){
    var cx=i?W*0.72:W*0.28;
    x.fillStyle='rgba(255,255,255,.08)';x.beginPath();x.roundRect?x.roundRect(cx-190,330,380,420,36):x.rect(cx-190,330,380,420);x.fill();
    if(w===i){x.strokeStyle='#8ce5c1';x.lineWidth=5;x.stroke()}
    x.fillStyle='#f5f6ff';x.font='800 200px '+ff;x.fillText(String(s[i]),cx,570);
    x.fillStyle='#aab2d1';x.font='700 44px '+ff;var n=p[i];if(n.length>14)n=n.slice(0,13)+'…';x.fillText(n,cx,700);
  });
  x.fillStyle='#8ce5c1';x.font='800 64px '+ff;
  x.fillText(w<0?'ფრე!':'🏆 '+(p[w].length>16?p[w].slice(0,15)+'…':p[w])+' იგებს!',W/2,880);
  if(siteUrl){x.fillStyle='#aab2d1';x.font='600 34px '+ff;x.fillText(siteUrl.replace(/^https?:\/\//,''),W/2,990)}
  return c;
}
function shareImage(){
  var go=function(){
    var c=drawCard();
    c.toBlob(function(blob){
      if(!blob)return toast('სურათის შექმნა ვერ მოხერხდა.');
      var file=new File([blob],'pawplay-result.png',{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        navigator.share({files:[file],text:shareText()}).catch(function(){});
      }else{
        var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pawplay-result.png';document.body.appendChild(a);a.click();a.remove();
        setTimeout(function(){URL.revokeObjectURL(a.href)},2000);toast('სურათი ჩამოიტვირთა.');
      }
    },'image/png');
  };
  if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load('800 60px "Noto Sans Georgian"'),document.fonts.load('700 40px "Noto Sans Georgian"')]).then(go,go)}else go();
}
var _result=result;
result=function(b){
  _result(b);
  try{
    var acts=b.querySelector('.demo-actions');
    if(acts){
      var html=recapHTML();if(html)acts.insertAdjacentHTML('beforebegin',html);
      acts.insertAdjacentHTML('afterend','<button class="btn btn-ghost full" id="gImg">📷 შედეგის სურათი</button>');
      $('#gImg').onclick=shareImage;
    }
    var sh=$('#gShare');
    if(sh)sh.onclick=function(){
      var t=shareText();
      (navigator.share?navigator.share({text:t}):navigator.clipboard.writeText(t).then(function(){toast('ტექსტი დაკოპირდა!')})).catch(function(){});
    };
  }catch(e){}
};

/* ---------- custom questions: export / import ---------- */
(function(){
  var save=$('#saveQuestion');if(!save)return;
  var row=document.createElement('div');row.className='io-row';
  row.innerHTML='<button class="btn btn-ghost" id="exportQs" type="button">⬇ ექსპორტი</button><button class="btn btn-ghost" id="importQs" type="button">⬆ იმპორტი</button><input type="file" id="importFile" accept="application/json,.json" hidden>';
  save.parentNode.insertBefore(row,$('#myQs'));
  function persist(){try{localStorage.setItem('pawplay_custom',JSON.stringify(custom))}catch(e){}}
  $('#exportQs').onclick=function(){
    if(!custom.length)return toast('ჯერ დაამატე რომელიმე კითხვა.');
    var blob=new Blob([JSON.stringify({app:'pawplay',v:1,questions:custom},null,1)],{type:'application/json'});
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pawplay-questions.json';document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(a.href)},2000);
  };
  $('#importQs').onclick=function(){$('#importFile').click()};
  $('#importFile').onchange=function(e){
    var f=e.target.files[0];e.target.value='';if(!f)return;
    if(f.size>500000)return toast('ფაილი ძალიან დიდია.');
    var r=new FileReader();
    r.onload=function(){
      try{
        var d=JSON.parse(r.result),list=Array.isArray(d)?d:d.questions;if(!Array.isArray(list))throw 0;
        var have={};custom.forEach(function(q){have[q.category+'|'+q.text]=1});
        var add=[];
        list.forEach(function(q,i){
          if(!q||typeof q.text!=='string')return;
          var cat=String(q.category),text=q.text.trim().slice(0,200);
          if(!(+cat>=0&&+cat<categories.length)||text.length<8||have[cat+'|'+text])return;
          var acc=Array.isArray(q.accepted)?q.accepted.filter(function(x){return typeof x==='string'}).map(function(x){return x.trim().slice(0,100)}).filter(Boolean).slice(0,10):[];
          have[cat+'|'+text]=1;add.push({id:Date.now()+i,category:cat,text:text,accepted:acc});
        });
        add=add.slice(0,Math.max(0,300-custom.length));
        if(!add.length)return toast('ახალი კითხვა ვერ მოიძებნა.');
        custom=custom.concat(add);persist();renderCategories();renderMyQs();fillCounts();
        toast('დაემატა '+add.length+' კითხვა.');
      }catch(err){toast('ფაილი არასწორი ფორმატისაა.')}
    };
    r.readAsText(f);
  };
})();

/* ---------- keep page text truthful ---------- */
(function(){
  var fb=window.PAWPLAY_FIREBASE&&window.PAWPLAY_FIREBASE.databaseURL;
  var total=categories.reduce(function(n,c){return n+c.questions.length},0),all100=categories.every(function(c){return c.questions.length>=100});
  $$('.faq details').forEach(function(d){
    var s=d.querySelector('summary').textContent,p=d.querySelector('p');if(!p)return;
    if(fb&&s.indexOf('ონლაინ')>-1)p.textContent='დიახ. ოთახის შექმნისას მიიღებ 5-ნიშნა კოდს, მეგობარი ამ კოდით შემოგიერთდება თავის მოწყობილობაზე.';
    if(fb&&s.indexOf('ინახება')>-1)p.textContent+=' ონლაინ რეჟიმში ოთახის მონაცემები დროებით ინახება Google Firebase-ში, სანამ ოთახი არსებობს.';
    if(s.indexOf('რამდენი კითხვაა')>-1&&all100)p.textContent='ამჟამად '+(Math.floor(total/10)*10)+'-ზე მეტი, '+categories.length+' კატეგორიაში. თითოეულ კატეგორიაში 100-ზე მეტია. ბაზა იზრდება, ხოლო საკუთარი კითხვების დამატებაც შეგიძლია.';
  });
  var note=$('#gameModal .note');if(fb&&note)note.textContent='ერთ მოწყობილობაზე ითამაშეთ მოწყობილობის გადაცემით, ან ქვემოთ შექმენი ონლაინ ოთახი და მეგობარს კოდი გაუგზავნე.';
})();

/* ---------- installable app + offline cache (only over http/https) ---------- */
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
}
})();
