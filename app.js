const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let custom=[];try{custom=JSON.parse(localStorage.getItem('pawplay_custom')||'[]')}catch(e){}
let G=null;
/* ---- matching: normalization + light Georgian ending stripping ---- */
const norm=s=>String(s).toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim();
const stem=w=>w.length>4?w.replace(/(ებით|ები|ებს|თვის|თან|ზე|ში|დან|ის|ს|მა|მ|ით|ად)$/,''):w;
const fold=s=>norm(s).split(' ').map(stem).join(' ');
const same=(a,b,acc=[])=>{const y=fold(b);return !!y&&[a,...acc].some(x=>fold(x)===y)};
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function pool(c){return[...categories[c].questions.map(t=>({t,acc:[]})),...custom.filter(q=>q.category===String(c)).map(q=>({t:q.text,acc:q.accepted||[]}))]}
/* ---- page UI ---- */
function renderCategories(){$('#totalQs').textContent=categories.reduce((n,c)=>n+c.questions.length,0);$('#categoryGrid').innerHTML=categories.map((c,i)=>`<article class="category-card" tabindex="0" role="button" data-cat="${i}"><div class="category-head"><div class="category-icon">${c.icon}</div><span class="category-count">${pool(i).length} კითხვა</span></div><h3>${c.name}</h3><p>${c.desc}</p></article>`).join('');
$$('.category-card').forEach(card=>{const go=()=>{$('#gameCategory').value=card.dataset.cat;fillCounts();openModal('gameModal')};card.onclick=go;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}})}
function fillSelects(){const o=categories.map((c,i)=>`<option value="${i}">${c.name}</option>`).join('');$('#gameCategory').innerHTML=o;$('#customCategory').innerHTML=o;fillCounts()}
function fillCounts(){const n=pool(+$('#gameCategory').value).length,o=[...new Set([5,10,15,20,30,50].filter(x=>x<n).concat(n))];$('#questionCount').innerHTML=o.map(x=>`<option${x===Math.min(10,n)?' selected':''}>${x}</option>`).join('')}
function openModal(id){const m=$('#'+id);m.classList.add('show');setTimeout(()=>{const f=m.querySelector('input,select,textarea,button:not(.close)');f&&f.focus()},50)}
function closeModal(id){$('#'+id).classList.remove('show')}
let tt;function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('show'),2500)}
['heroStart','topStart','bottomStart'].forEach(id=>$('#'+id).onclick=()=>{fillCounts();openModal('gameModal')});
$('#openCustom').onclick=()=>{renderMyQs();openModal('customModal')};
$$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
$$('.modal-backdrop').forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove('show')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$$('.modal-backdrop.show').forEach(m=>m.classList.remove('show'))});
$('#gameCategory').onchange=fillCounts;
const nav=$('.topbar nav');$('#menuBtn').onclick=()=>{const o=nav.classList.toggle('open');$('#menuBtn').setAttribute('aria-expanded',o)};
$$('.topbar nav a').forEach(a=>a.onclick=()=>nav.classList.remove('open'));
/* ---- custom questions ---- */
$('#saveQuestion').onclick=()=>{const text=$('#customText').value.trim();if(text.length<8)return toast('კითხვა ცოტა უფრო სრულად ჩაწერე.');
custom.push({id:Date.now(),category:$('#customCategory').value,text,accepted:$('#acceptedAnswers').value.split(',').map(x=>x.trim()).filter(Boolean)});
try{localStorage.setItem('pawplay_custom',JSON.stringify(custom))}catch(e){}
$('#customText').value='';$('#acceptedAnswers').value='';closeModal('customModal');renderCategories();renderMyQs();toast('შენი კითხვა შენახულია და თამაშში ჩაერთვება!')};
/* ---- game: pass-and-play on one device ---- */
$('#createGame').onclick=()=>{if(!$('#playerOne').value.trim()||!$('#playerTwo').value.trim()){$($('#playerOne').value.trim()?'#playerTwo':'#playerOne').focus();return toast('ჩაწერე ორივე მოთამაშის სახელი.')}
const c=+$('#gameCategory').value,n=+$('#questionCount').value,
p=[$('#playerOne').value.trim()||'მოთამაშე 1',$('#playerTwo').value.trim()||'მოთამაშე 2'];
G={duel:c===6,p,qs:shuffle(pool(c)).slice(0,n),i:0,s:[0,0],ph:'answer',a:'',g:''};
$('#demoTitle').textContent=p[0]+' × '+p[1];closeModal('gameModal');openModal('demoModal');draw()};
function wire(id,fn){const e=$('#'+id);if(e)e.onclick=fn}
function draw(){const b=$('#gBody'),n=G.qs.length;
if(G.i>=n)return result(b);
const q=G.qs[G.i],A=window.pawA?pawA(G):G.i%2,B=1-A,[pa,pb]=[esc(G.p[A]),esc(G.p[B])];
$('#demoProgress').style.width=(G.i/n*100)+'%';
const head=`<div class="demo-meta"><span>კითხვა ${G.i+1} / ${n}</span><span>${esc(G.p[0])} ${G.s[0]} : ${G.s[1]} ${esc(G.p[1])}</span></div>`;
const inp=(m,ph)=>`<input id="gIn" ${m?'class="masked" ':''}autocomplete="off" placeholder="${ph}">`;
const next=()=>{G.i++;G.ph='answer';draw()};
if(G.ph==='answer'){b.innerHTML=head+`<p class="g-who">${G.duel?pa+'-ს რიგია':pa+', უპასუხე შენს შესახებ'}</p><h3>${esc(q.t)}</h3>${inp(1,'ჩაწერე პასუხი — მეორე ვერ დაინახავს')}<div class="demo-actions"><button class="btn btn-ghost" id="gSkip">გამოტოვება</button><button class="btn btn-primary" id="gOk">შემდეგი →</button></div>`;
wire('gSkip',next);wire('gOk',()=>{const v=$('#gIn').value.trim();if(!v)return toast('ჩაწერე პასუხი ან გამოტოვე.');G.a=v;G.ph='pass';draw()})}
else if(G.ph==='pass'){b.innerHTML=head+`<div class="pass">📱</div><h3>გადაეცი მოწყობილობა: ${pb}</h3><p class="modal-sub">${pa}-ის პასუხი დამალულია.</p><button class="btn btn-primary full" id="gOk">მზად ვარ →</button>`;
wire('gOk',()=>{G.ph='guess';draw()})}
else if(G.ph==='guess'){b.innerHTML=head+`<p class="g-who">${G.duel?pb+'-ს რიგია':pb+', გამოიცანი, რას უპასუხებდა '+pa}</p><h3>${esc(q.t)}</h3>${inp(0,G.duel?'შენი პასუხი...':'შენი ვარაუდი...')}<div class="demo-actions"><button class="btn btn-primary full" id="gOk">დადასტურება →</button></div>`;
wire('gOk',()=>{const v=$('#gIn').value.trim();if(!v)return toast('ჩაწერე ვარაუდი.');G.g=v;G.ph='reveal';draw()})}
else if(G.duel){b.innerHTML=head+`<h3>${esc(q.t)}</h3><div class="reveal"><div><small>${pa}</small><b>${esc(G.a)}</b></div><div><small>${pb}</small><b>${esc(G.g)}</b></div></div><p class="note">ერთად გადაწყვიტეთ, ვისი პასუხი იყო უკეთესი.</p><div class="demo-actions"><button class="btn btn-primary" id="gA">${pa}</button><button class="btn btn-ghost" id="gD">ფრე</button><button class="btn btn-primary" id="gB">${pb}</button></div>`;
wire('gA',()=>{G.s[A]++;next()});wire('gD',next);wire('gB',()=>{G.s[B]++;next()})}
else{const auto=same(G.a,G.g,q.acc);b.innerHTML=head+`<h3>${esc(q.t)}</h3><div class="reveal"><div><small>${pa} უპასუხა</small><b>${esc(G.a)}</b></div><div><small>${pb} გამოიცნო</small><b>${esc(G.g)}</b></div></div><p class="note">სისტემა: ${auto?'✓ პასუხები ემთხვევა':'პასუხები სიტყვასიტყვით არ ემთხვევა'}. საბოლოოდ წყვეტს ${pa}.</p><div class="demo-actions"><button class="btn btn-ghost${auto?'':' hint'}" id="gNo">✗ ვერ გამოიცნო</button><button class="btn btn-primary${auto?' hint':''}" id="gYes">✓ გამოიცნო</button></div>`;
wire('gNo',next);wire('gYes',()=>{G.s[B]++;next()})}
const i=$('#gIn');if(i){i.focus();i.onkeydown=e=>{if(e.key==='Enter')$('#gOk').click()}}}
function result(b){$('#demoProgress').style.width='100%';const[s0,s1]=G.s,w=s0===s1?null:s0>s1?0:1;
const txt=`Pawplay: ${G.p[0]} ${s0} : ${s1} ${G.p[1]} — ${G.duel?'ვის პასუხი იყო უკეთესი?':'ვინ ვის უკეთ იცნობს?'}`;
b.innerHTML=`<div class="pass">🏆</div><h3>${w===null?(G.duel?'ფრე! ორივე ერთნაირად კარგი იყავით':'ფრე! თქვენ ერთმანეთს ერთნაირად იცნობთ'):esc(G.p[w])+' იგებს!'}</h3><div class="scoreboard"><div><b>${s0}</b><small>${esc(G.p[0])}</small></div><div><b>${s1}</b><small>${esc(G.p[1])}</small></div></div><div class="demo-actions"><button class="btn btn-ghost" id="gShare">გაზიარება</button><button class="btn btn-primary" id="gAgain">ახალი თამაში</button></div>`;
wire('gShare',()=>{(navigator.share?navigator.share({text:txt}):navigator.clipboard.writeText(txt).then(()=>toast('ტექსტი დაკოპირდა!'))).catch(()=>{})});
wire('gAgain',()=>{closeModal('demoModal');openModal('gameModal')})}
renderCategories();fillSelects();
function renderMyQs(){const e=$('#myQs');e.innerHTML=custom.length?'<h4>შენი კითხვები</h4>'+custom.map(q=>`<div class="myq"><span>${esc(q.text)}<small>${esc((categories[q.category]||{}).name||'')}</small></span><button data-id="${q.id}" aria-label="წაშლა">🗑</button></div>`).join(''):'';
e.querySelectorAll('button').forEach(b=>b.onclick=()=>{custom=custom.filter(q=>String(q.id)!==b.dataset.id);try{localStorage.setItem('pawplay_custom',JSON.stringify(custom))}catch(x){}renderMyQs();renderCategories();fillCounts()})}
/* ---- online mode (Firebase Realtime Database; enabled only if config.js has a config) ---- */
const FB=window.PAWPLAY_FIREBASE;let db=null,roomRef=null,me=0,O=null;
function loadFB(cb){const L=s=>new Promise((r,j)=>{const e=document.createElement('script');e.src=s;e.onload=r;e.onerror=j;document.head.appendChild(e)});
if(db)return cb();
const need=(t,f)=>(typeof firebase!=='undefined'&&typeof firebase[t]==='function')?Promise.resolve():L('https://www.gstatic.com/firebasejs/10.12.2/'+f);
need('initializeApp','firebase-app-compat.js').then(()=>need('database','firebase-database-compat.js')).then(()=>{if(!firebase.apps.length)firebase.initializeApp(FB);db=firebase.database();cb()}).catch(()=>toast('ონლაინ სერვისი ვერ ჩაიტვირთა.'))}
const roomCode=()=>{const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from({length:5},()=>c[Math.floor(Math.random()*c.length)]).join('')};
function startOnline(create){const name=$('#playerOne').value.trim()||'მოთამაშე';
loadFB(()=>{if(create){const c=+$('#gameCategory').value,n=+$('#questionCount').value,k=roomCode(),qs=shuffle(pool(c)).slice(0,n);me=0;roomRef=db.ref('rooms/'+k);
roomRef.set({k,p:[name,''],qs:qs.map(q=>q.t),acc:qs.map(q=>q.acc.length?q.acc:['']),i:0,s:[0,0],duel:c===6,ph:'answer',a:'',g:'',t:Date.now()}).then(listen).catch(()=>toast('ოთახის შექმნა ვერ მოხერხდა.'))}
else{const k=$('#joinCode').value.trim().toUpperCase();if(!k)return toast('ჩაწერე ოთახის კოდი.');me=1;roomRef=db.ref('rooms/'+k);
roomRef.once('value').then(s=>{const v=s.val();if(!v)return toast('ოთახი ვერ მოიძებნა.');if(v.p[1])return toast('ოთახი უკვე სავსეა.');roomRef.child('p/1').set(name).then(listen)}).catch(()=>toast('შესვლა ვერ მოხერხდა.'))}})}
function listen(){closeModal('gameModal');openModal('demoModal');roomRef.on('value',s=>{const v=s.val();if(v){O=v;drawOnline()}})}
function drawOnline(){const v=O,b=$('#gBody'),n=v.qs.length;$('#demoTitle').textContent=v.p[0]+' × '+(v.p[1]||'…');
if(!v.p[1]){b.innerHTML=`<div class="pass">⏳</div><h3>ელოდები მეგობარს</h3><p class="modal-sub">გაუგზავნე ოთახის კოდი:</p><div class="room-code">${esc(v.k)}</div>`;return}
const s=v.s||[0,0];if(v.i>=n){G={p:v.p,s,duel:v.duel};return result(b)}
const A=v.i%2,B=1-A,q=v.qs[v.i],acc=((v.acc&&v.acc[v.i])||[]).filter(Boolean),pa=esc(v.p[A]),pb=esc(v.p[B]),upd=o=>roomRef.update(o);
$('#demoProgress').style.width=(v.i/n*100)+'%';
const head=`<div class="demo-meta"><span>კითხვა ${v.i+1} / ${n}</span><span>${esc(v.p[0])} ${s[0]} : ${s[1]} ${esc(v.p[1])}</span></div>`;
const wait=t=>b.innerHTML=head+`<h3>${esc(q)}</h3><div class="pass">⏳</div><p class="modal-sub">${t}</p>`;
const ask=(label,field,nph)=>{b.innerHTML=head+`<p class="g-who">${label}</p><h3>${esc(q)}</h3><input id="gIn" autocomplete="off" placeholder="შენი პასუხი..."><div class="demo-actions"><button class="btn btn-primary full" id="gOk">გაგზავნა →</button></div>`;
wire('gOk',()=>{const x=$('#gIn').value.trim();if(!x)return toast('ჩაწერე პასუხი.');upd({[field]:x,ph:nph})});const i=$('#gIn');i.focus();i.onkeydown=e=>{if(e.key==='Enter')$('#gOk').click()}};
const go=pt=>{const s2=[...s];if(pt!=null)s2[pt]++;upd({i:v.i+1,ph:'answer',a:'',g:'',s:s2})};
if(v.ph==='answer')return me===A?ask(v.duel?'შენი რიგია':'უპასუხე შენს შესახებ','a','guess'):wait(pa+' პასუხობს…');
if(v.ph==='guess')return me===B?ask(v.duel?'შენი რიგია':'გამოიცანი, რას უპასუხებდა '+pa,'g','reveal'):wait(pb+' ფიქრობს…');
const both=`<h3>${esc(q)}</h3><div class="reveal"><div><small>${pa}</small><b>${esc(v.a)}</b></div><div><small>${pb}</small><b>${esc(v.g)}</b></div></div>`;
if(me!==A){b.innerHTML=head+both+`<p class="note">ელოდები ${pa}-ის გადაწყვეტილებას…</p>`;return}
if(v.duel){b.innerHTML=head+both+`<p class="note">აირჩიე, ვისი პასუხი იყო უკეთესი.</p><div class="demo-actions"><button class="btn btn-primary" id="gA">${pa}</button><button class="btn btn-ghost" id="gD">ფრე</button><button class="btn btn-primary" id="gB">${pb}</button></div>`;wire('gA',()=>go(A));wire('gD',()=>go());wire('gB',()=>go(B))}
else{const auto=same(v.a,v.g,acc);b.innerHTML=head+both+`<p class="note">სისტემა: ${auto?'✓ პასუხები ემთხვევა':'პასუხები სიტყვასიტყვით არ ემთხვევა'}. საბოლოოდ წყვეტ შენ.</p><div class="demo-actions"><button class="btn btn-ghost${auto?'':' hint'}" id="gNo">✗ ვერ გამოიცნო</button><button class="btn btn-primary${auto?' hint':''}" id="gYes">✓ გამოიცნო</button></div>`;wire('gNo',()=>go());wire('gYes',()=>go(B))}}
if(FB&&FB.databaseURL){$('#onlineBox').hidden=false;$('#onlineBtn').onclick=()=>startOnline(true);$('#joinBtn').onclick=()=>startOnline(false)}
