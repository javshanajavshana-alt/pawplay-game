/* PawPlay stage36: player nickname (chosen after Google sign-in, reused in rooms) */
(function () {
  'use strict';
  var KEY = 'pawplay_nick', OLD = 'თორნიკე';

  function get() { try { return (localStorage.getItem(KEY) || '').trim(); } catch (e) { return ''; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function field() { return document.getElementById('playerOne'); }

  /* put the saved nickname into the name field of the game window */
  function apply() {
    var f = field();
    if (!f) return;
    f.maxLength = 30;
    f.placeholder = 'შენი სახელი';
    var n = get();
    if (n) f.value = n;
    else if (f.value.trim() === OLD) f.value = '';
  }

  /* remember whatever the player types in that field */
  function bindField() {
    var f = field();
    if (!f) return;
    f.addEventListener('input', function () {
      var v = f.value.trim().slice(0, 30);
      if (v) set(v);
    });
  }

  /* small self-contained styles for the name window */
  function addCss() {
    var s = document.createElement('style');
    s.textContent =
      '.nk-back{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,.75);backdrop-filter:blur(6px);padding:16px}' +
      '.nk-card{width:100%;max-width:400px;background:#1a2447;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:26px;color:#fff;font-family:inherit;box-shadow:0 20px 60px rgba(0,0,0,.5)}' +
      '.nk-card h3{margin:0 0 8px;font-size:22px}' +
      '.nk-card p{margin:0 0 16px;font-size:14px;opacity:.75;line-height:1.5}' +
      '.nk-card input{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:#0f1530;color:#fff;font:inherit;font-size:16px;outline:none}' +
      '.nk-card input:focus{border-color:#8b7cf6}' +
      '.nk-err{min-height:18px;margin:8px 0 0;font-size:13px;color:#ff9aa8}' +
      '.nk-card button{width:100%;margin-top:10px;padding:14px;border:0;border-radius:14px;background:linear-gradient(135deg,#8b7cf6,#6aa8ff);color:#0b1030;font:inherit;font-weight:700;font-size:16px;cursor:pointer}';
    document.head.appendChild(s);
  }

  /* the "what name do you want to play with?" window */
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

  /* when Google sign-in happens and no nickname is saved yet, ask for one */
  function watchAuth() {
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (window.firebase && firebase.apps && firebase.apps.length && typeof firebase.auth === 'function') {
        clearInterval(t);
        firebase.auth().onAuthStateChanged(function (u) {
          if (u && !get()) ask(u.displayName || '');
        });
      } else if (tries > 120) {
        clearInterval(t);
      }
    }, 500);
  }

  /* speed: start downloading the online-mode files early + instant feedback on click */
  function speedUp() {
    var cfg = window.PAWPLAY_FIREBASE;
    if (cfg && cfg.databaseURL) {
      var pc = document.createElement('link');
      pc.rel = 'preconnect';
      pc.href = 'https://www.gstatic.com';
      document.head.appendChild(pc);
      var go = function () {
        ['firebase-app-compat.js', 'firebase-database-compat.js'].forEach(function (f) {
          var l = document.createElement('link');
          l.rel = 'preload';
          l.as = 'script';
          l.href = 'https://www.gstatic.com/firebasejs/10.12.2/' + f;
          document.head.appendChild(l);
        });
      };
      if (document.readyState === 'complete') setTimeout(go, 800);
      else window.addEventListener('load', function () { setTimeout(go, 800); });
    }
    ['onlineBtn', 'joinBtn'].forEach(function (id) {
      var b = document.getElementById(id);
      if (!b) return;
      b.addEventListener('click', function (e) {
        if (b.getAttribute('data-busy')) { e.stopImmediatePropagation(); e.preventDefault(); return; }
        var old = b.innerHTML;
        b.setAttribute('data-busy', '1');
        b.style.opacity = '.7';
        b.textContent = '⏳ იტვირთება…';
        setTimeout(function () {
          b.innerHTML = old;
          b.style.opacity = '';
          b.removeAttribute('data-busy');
        }, 3500);
      }, true);
    });
  }

  function init() {
    speedUp();
    addCss();
    bindField();
    apply();
    var m = document.getElementById('gameModal');
    if (m) {
      new MutationObserver(function () { if (m.classList.contains('show')) apply(); })
        .observe(m, { attributes: true, attributeFilter: ['class'] });
    }
    watchAuth();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
