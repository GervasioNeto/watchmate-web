// Service worker do WatchMate: o app abre rápido e abre mesmo sem internet (a casca, com o
// aviso de sem conexão; os dados continuam vindo só da API).
//
// - Páginas: rede primeiro, para cada deploy chegar na hora. Se a rede falhar ou demorar,
//   abre com a última cópia do index.html (o app é uma página só: todo endereço é ela).
// - /assets/*: os arquivos do build levam o hash no nome e nunca mudam, então vêm do cache.
//   Um deploy novo traz nomes novos, e os antigos saem quando passam do limite.
// - Fontes do Google: do cache; o CSS delas se atualiza em segundo plano.
// - Todo o resto (API, Supabase, pôsteres do TMDB) passa direto, sem cache aqui.
//
// Também mostra os avisos por push (fim do arquivo).
//
// Mudou este arquivo? Aumente o VERSION: é ele que faz os celulares trocarem de versão.

const VERSION = 3;
const SHELL_CACHE = `watchmate-shell-v${VERSION}`;
const ASSETS_CACHE = 'watchmate-assets';
const FONTS_CACHE = 'watchmate-fonts';
const KNOWN_CACHES = [SHELL_CACHE, ASSETS_CACHE, FONTS_CACHE];

const SHELL_URL = '/index.html';
const MAX_ASSETS = 40;
// Quanto esperar pela rede antes de abrir com a cópia guardada (internet fraca).
const NETWORK_TIMEOUT_MS = 3500;

self.addEventListener('install', (event) => {
  // Sem a cópia, o app só não abre offline até a próxima visita: não vale travar a instalação.
  event.waitUntil(
    saveShell()
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('watchmate-') && !KNOWN_CACHES.includes(name))
          .map((name) => caches.delete(name)),
      );
      // A página começa a baixar enquanto o service worker acorda, em vez de esperar por ele.
      await self.registration.navigationPreload?.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(openPage(event));
  } else if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(fromCacheFirst(event, ASSETS_CACHE, MAX_ASSETS));
  } else if (url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(fromCacheFirst(event, FONTS_CACHE));
  } else if (url.origin === 'https://fonts.googleapis.com') {
    event.respondWith(fromCacheThenRefresh(event, FONTS_CACHE));
  }
});

// Guarda o index.html e os arquivos que ele carrega. Na primeira visita o app abriu antes
// de o service worker existir, então esses arquivos não passaram por ele: entram aqui.
async function saveShell() {
  const response = await fetch(SHELL_URL, { cache: 'no-cache' });
  if (!response.ok) return;
  const html = await response.clone().text();
  await (await caches.open(SHELL_CACHE)).put(SHELL_URL, response);
  const assets = [...new Set(html.match(/\/assets\/[^"'\s)]+/g) ?? [])];
  await (await caches.open(ASSETS_CACHE)).addAll(assets);
}

async function openPage(event) {
  const cache = await caches.open(SHELL_CACHE);
  const fromNetwork = (async () => {
    const response = (await event.preloadResponse) ?? (await fetch(event.request));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (response.headers.get('content-type')?.includes('text/html')) {
      await cache.put(SHELL_URL, response.clone());
    }
    return response;
  })();
  // Se a resposta vier do cache, a da rede ainda chega e atualiza a cópia para a próxima vez.
  event.waitUntil(fromNetwork.catch(() => undefined));

  try {
    return await withTimeout(fromNetwork, NETWORK_TIMEOUT_MS);
  } catch {
    const saved = await cache.match(SHELL_URL);
    if (saved) return saved;
    // Sem cópia guardada, a rede lenta ainda é melhor que nada.
    return fromNetwork.catch(() => offlinePage());
  }
}

async function fromCacheFirst(event, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const saved = await cache.match(event.request);
  if (saved) return saved;

  const response = await fetch(event.request);
  if (response.ok) {
    event.waitUntil(
      cache.put(event.request, response.clone()).then(() => maxEntries && trim(cache, maxEntries)),
    );
  }
  return response;
}

async function fromCacheThenRefresh(event, cacheName) {
  const cache = await caches.open(cacheName);
  const saved = await cache.match(event.request);
  const refresh = fetch(event.request).then(async (response) => {
    if (response.ok) await cache.put(event.request, response.clone());
    return response;
  });

  if (!saved) return refresh;
  event.waitUntil(refresh.catch(() => undefined));
  return saved;
}

// Apaga os mais antigos (o cache devolve as chaves na ordem em que entraram).
async function trim(cache, maxEntries) {
  const keys = await cache.keys();
  const excess = keys.slice(0, Math.max(0, keys.length - maxEntries));
  await Promise.all(excess.map((key) => cache.delete(key)));
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// ---------- Avisos por push ----------
// A API manda { title, body, path, tag, image, renotify, actions, badge } (ver watchmate-api,
// src/push). O aviso aparece mesmo com o app fechado e o celular bloqueado; tocar nele abre
// a tela certa. Avisos com a mesma tag se substituem: dez episódios seguidos viram um só.
// O aviso já está guardado em "Entre vocês" quando chega: o push é só a cópia que avisa.

const APP_HOME = '/my-list';

self.addEventListener('push', (event) => {
  const message = readPush(event);
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(message.title, {
        body: message.body,
        icon: '/icons/icon-192.png',
        // O ícone pequeno da barra de status do Android: só a silhueta conta.
        badge: '/icons/badge-96.png',
        image: message.image,
        tag: message.tag,
        // Um convite novo toca de novo mesmo trocando o anterior (renotify exige tag).
        renotify: message.renotify && !!message.tag,
        // Os botões ("Bora!", "Hoje não"): o Android mostra; o iPhone, não.
        actions: message.actions.map(({ action, title }) => ({ action, title })),
        data: {
          path: message.path,
          actionPaths: Object.fromEntries(
            message.actions.map(({ action, path }) => [action, path]),
          ),
        },
        lang: 'pt-BR',
      }),
      updateBadge(message.badge),
      tellOpenApp(message.tag),
    ]),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data ?? {};
  // Um botão abre a tela que faz a ação (ex.: aceitar o convite); o resto do aviso, a tela dele.
  const path = (event.action && data.actionPaths?.[event.action]) || data.path || APP_HOME;
  event.waitUntil(openApp(path));
});

// O número no ícone do app instalado (iPhone e computador; o Android põe o pontinho sozinho).
async function updateBadge(count) {
  if (typeof count !== 'number' || !self.navigator.setAppBadge) return;
  try {
    await (count > 0 ? self.navigator.setAppBadge(count) : self.navigator.clearAppBadge());
  } catch {
    // Sem permissão para o número: o aviso em si já chegou.
  }
}

// Com o app aberto, ele busca de novo o que o aviso mudou (ver usePushUpdates).
async function tellOpenApp(tag) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of windows) client.postMessage({ type: 'push', tag });
}

// Conteúdo estranho não quebra nada: vira um aviso genérico que abre a lista.
function readPush(event) {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    // Sem conteúdo legível.
  }
  return {
    title: typeof data.title === 'string' && data.title ? data.title : 'WatchMate',
    body: typeof data.body === 'string' ? data.body : '',
    path: isAppPath(data.path) ? data.path : APP_HOME,
    tag: typeof data.tag === 'string' ? data.tag : undefined,
    image: typeof data.image === 'string' ? data.image : undefined,
    renotify: data.renotify === true,
    actions: Array.isArray(data.actions)
      ? data.actions
          .filter(
            (item) =>
              item &&
              typeof item.action === 'string' &&
              typeof item.title === 'string' &&
              isAppPath(item.path),
          )
          .slice(0, 2)
      : [],
    badge: typeof data.badge === 'number' ? data.badge : null,
  };
}

// Só telas do próprio app ("/inbox?..."), nunca "//outro-site".
function isAppPath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

// Com o app aberto, traz ele para a frente e leva até a tela, sem recarregar (o app ouve a
// mensagem; ver useNotificationNavigation). Fechado, abre direto nela.
async function openApp(path) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const app = windows.find((client) => new URL(client.url).origin === self.location.origin);
  if (app) {
    await app.focus();
    app.postMessage({ type: 'navigate', path });
    return;
  }
  await self.clients.openWindow(path);
}

// Só aparece se a pessoa abrir o app sem internet antes de ele ter guardado a cópia.
function offlinePage() {
  return new Response(
    `<!doctype html>
<html lang="pt-BR">
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#111013" />
  <title>WatchMate</title>
  <body style="margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#111013;color:#f2f0f3;font:16px/1.5 system-ui,sans-serif;text-align:center">
    <main>
      <p style="margin:0 0 4px;font-size:20px;font-weight:800">Sem internet</p>
      <p style="margin:0 0 20px;color:#a8a4ae">O WatchMate precisa de conexão para abrir.</p>
      <button onclick="location.reload()" style="min-height:44px;padding:0 20px;border:0;border-radius:10px;background:#ff5400;color:#160a03;font:inherit;font-weight:600">Tentar de novo</button>
    </main>
  </body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
