/* PawPlay stage36
   1) player nickname (asked once after Google sign-in, reused in rooms)
   2) online-room button: waits for the Firebase copy that stage35 is already loading
      (instead of loading a second copy, which is slow/fragile on phones) and shows a loading state.
   Loaded after stage35.js. Does not touch the Google sign-in code. */
(function () {
  'use strict';

  /* ================= 1) nickname ================= */
  var KEY = 'pawplay_nick', OLD = 'თორნიკე';
  function get() { try { return (localStorage.getItem(KEY) || '').trim(); } catch (e) { return ''; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function field() { return document.getElementById('playerOne'); }

  function apply() {
    var f = field();
    if (!f) return;
    f.maxLength = 30;
    f.placeholder = 'შენი სახელი';
    var n = get();
    if (n) f.value = n;
    else if (f.value.trim() === OLD) f.value = '';
  }

  function bindField() {
    var f = field();
    if (!f) return;
    f.addEventListener('input', function () {
      var v = f.value.trim().slice(0, 30);
      if (v) set(v);
    });
  }

  function addCss() {
    var s = document.createElement('style');
    s.textContent =
      '.nk-back{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,.85);padding:16px}' +
      '.nk-card{width:100%;max-width:400px;background:#1a2447;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:26px;color:#fff;font-family:inherit;box-shadow:0 20px 60px rgba(0,0,0,.5)}' +
      '.nk-card h3{margin:0 0 8px;font-size:22px}' +
      '.nk-card p{margin:0 0 16px;font-size:14px;opacity:.75;line-height:1.5}' +
      '.nk-card input{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:#0f1530;color:#fff;font:inherit;font-size:16px;outline:none}' +
      '.nk-card input:focus{border-color:#8b7cf6}' +
      '.nk-err{min-height:18px;margin:8px 0 0;font-size:13px;color:#ff9aa8}' +
      '.nk-card button{width:100%;margin-top:10px;padding:14px;border:0;border-radius:14px;background:linear-gradient(135deg,#8b7cf6,#6aa8ff);color:#0b1030;font:inherit;font-weight:700;font-size:16px;cursor:pointer}';
    document.head.appendChild(s);
  }

  function ask(prefill) {
    if (document.getElementById('nkBox')) return;
    var back = document.createElement('div');
    back.className = 'nk-back';
    back.id = 'nkBox';
    var card = document.createElement('div');
    card.className = 'nk-card';
    var h = document.createElement('h3');
    h.textContent = 'რა სახელით გინდა ითამაშო?';
    var p = document.createElement('p');
    p.textContent = 'ეს სახელი დაინახავს მეგობარი ოთახში. მოგვიანებით შეგიძლია შეცვალო.';
    var inp = document.createElement('input');
    inp.maxLength = 30;
    inp.placeholder = 'შენი სახელი';
    inp.autocomplete = 'off';
    inp.value = prefill || '';
    var err = document.createElement('div');
    err.className = 'nk-err';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'შენახვა';
    function save() {
      var v = inp.value.trim();
      if (v.length < 2) { err.textContent = 'ჩაწერე მინიმუმ 2 ასო.'; return; }
      set(v.slice(0, 30));
      back.remove();
      apply();
    }
    btn.onclick = save;
    inp.onkeydown = function (e) { if (e.key === 'Enter') save(); };
    card.appendChild(h); card.appendChild(p); card.appendChild(inp); card.appendChild(err); card.appendChild(btn);
    back.appendChild(card);
    document.body.appendChild(back);
    setTimeout(function () { inp.focus(); inp.select(); }, 50);
  }

  function watchAuth() {
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (window.firebase && firebase.apps && firebase.apps.length && typeof firebase.auth === 'function') {
        clearInterval(t);
        firebase.auth().onAuthStateChanged(function (u) {
          if (u && !get()) ask(u.displayName || '');
        });
      } else if (tries > 240) {
        clearInterval(t);
      }
    }, 500);
  }

  /* ================= 2) online room button ================= */
  var busyT = null;
  function busy(on) {
    ['onlineBtn', 'joinBtn'].forEach(function (id) {
      var b = document.getElementById(id);
      if (!b) return;
      if (on) {
        if (b.getAttribute('data-l') === null) b.setAttribute('data-l', b.textContent);
        b.disabled = true;
        b.textContent = '⏳ იტვირთება…';
      } else if (b.getAttribute('data-l') !== null) {
        b.disabled = false;
        b.textContent = b.getAttribute('data-l');
        b.removeAttribute('data-l');
      }
    });
    clearTimeout(busyT);
    if (on) busyT = setTimeout(function () { busy(false); }, 30000);
  }

  function ownLoad(cb) {
    var B = 'https://www.gstatic.com/firebasejs/10.12.2/';
    var L = function (s) { return new Promise(function (r, j) { var e = document.createElement('script'); e.src = s; e.onload = r; e.onerror = j; document.head.appendChild(e); }); };
    var need = function (t, f) { return (typeof firebase !== 'undefined' && typeof firebase[t] === 'function') ? Promise.resolve() : L(B + f); };
    need('initializeApp', 'firebase-app-compat.js')
      .then(function () { return need('database', 'firebase-database-compat.js'); })
      .then(function () { if (!firebase.apps.length) firebase.initializeApp(FB); db = firebase.database(); cb(); })
      .catch(function () { toast('ონლაინ სერვისი ვერ ჩაიტვირთა.'); });
  }

  function patchOnline() {
    if (typeof window.loadFB !== 'function' || typeof window.startOnline !== 'function') return;

    /* wait for the Firebase that stage35 is already loading; load our own only if nobody started */
    window.loadFB = function (cb) {
      if (db) return cb();
      var ready = function () { return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length && typeof firebase.database === 'function'; };
      var fin = function () {
        try { db = firebase.database(); } catch (e) { toast('ონლაინ სერვისი ვერ ჩაიტვირთა.'); return; }
        cb();
      };
      if (ready()) return fin();
      var n = 0;
      var t = setInterval(function () {
        n++;
        if (ready()) { clearInterval(t); return fin(); }
        var started = !!document.querySelector('script[src*="firebase-app-compat"]');
        if ((document.readyState === 'complete' && !started && n > 6) || n > 120) { clearInterval(t); ownLoad(cb); }
      }, 250);
    };

    var so = window.startOnline;
    window.startOnline = function (create) { busy(true); return so(create); };

    if (typeof window.listen === 'function') {
      var li = window.listen;
      window.listen = function () { busy(false); return li.apply(this, arguments); };
    }
    if (typeof window.toast === 'function') {
      var ts = window.toast;
      window.toast = function (t) { busy(false); return ts(t); };
    }
  }

  function init() {
    addCss();
    bindField();
    apply();
    var m = document.getElementById('gameModal');
    if (m) {
      new MutationObserver(function () { if (m.classList.contains('show')) apply(); })
        .observe(m, { attributes: true, attributeFilter: ['class'] });
    }
    patchOnline();
    watchAuth();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
