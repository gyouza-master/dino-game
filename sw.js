// ダイナソー・ドミニオン Service Worker
// HTMLはネット優先（更新が届く）、それ以外はキャッシュ優先（オフラインで遊べる）
const CACHE = 'dino-v6';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './three.min.js',
  './js/post/CopyShader.js',
  './js/post/LuminosityHighPassShader.js',
  './js/post/GammaCorrectionShader.js',
  './js/post/EffectComposer.js',
  './js/post/RenderPass.js',
  './js/post/ShaderPass.js',
  './js/post/UnrealBloomPass.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isHTML = e.request.mode === 'navigate' || e.request.url.endsWith('index.html');
  if (isHTML) {
    // ネット優先：成功したらキャッシュ更新、オフラインならキャッシュ
    e.respondWith(
      fetch(e.request).then(res => {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // 画像・JS等：キャッシュ優先＋初回取得時にキャッシュへ保存
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && e.request.url.startsWith(self.location.origin)) {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
      }
      return res;
    }))
  );
});
