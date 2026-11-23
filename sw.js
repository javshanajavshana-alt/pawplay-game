/* Pawplay service worker: network first, cached copy when offline. */
var V='pawplay-v34',FILES=['./','index.html','style.css','extras.css','app.js','extras.js','stage14.js','stage14.css','stage15.js','stage15.css','stage16.js','stage17.js','stage18.js','stage19.js','stage19.css','stage20.js','stage20.css','stage21.css','stage23.js','stage23.css','stage24.js','stage24.css','stage25.js','stage25.css','stage30.js','stage30.css','stage31.css','stage33.css','stage35.js','stage35.css','avatar-tornike.webp','avatar-ana.webp','hero-art.webp','questions.js','questions_extra.js','config.js','privacy.html','terms.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(FILES)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(fetch(r).then(function(res){if(res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)})}return res}).catch(function(){return caches.match(r).then(function(m){return m||caches.match('index.html')})}));
});
