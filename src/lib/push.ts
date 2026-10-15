import { isAppleMobile, isStandalone } from '@/lib/pwa';

// O lado do navegador dos avisos por push: inscrever e desinscrever este aparelho. Quem
// mostra o aviso é o service worker (public/sw.js); quem manda é a API.

// Quanto esperar o service worker ficar pronto antes de desistir (ele registra no load).
const READY_TIMEOUT_MS = 10_000;
// A primeira inscrição conversa com o serviço de push do navegador e pode demorar uns
// segundos; travou além disso, vira erro (o switch para de girar e pede para tentar de novo).
const SUBSCRIBE_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer = 0;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
}

// O navegador sabe receber push: service worker, Push API e notificações.
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// No iPhone e no iPad, só o app instalado (na Tela de Início) recebe push; no Safari, não.
// Só vale para explicar a falta de push: quem decide se dá é isPushSupported.
export function needsInstallForPush(): boolean {
  return isAppleMobile() && !isStandalone();
}

export function notificationPermission(): NotificationPermission {
  return isPushSupported() ? Notification.permission : 'denied';
}

function readyRegistration(): Promise<ServiceWorkerRegistration> {
  return withTimeout(
    navigator.serviceWorker.ready,
    READY_TIMEOUT_MS,
    'O service worker não ficou pronto',
  );
}

// A chave VAPID vem em base64 de URL; o navegador quer os bytes.
function keyToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

// A inscrição foi feita com esta chave? Se a API trocar de chaves, as antigas não valem mais.
function isSubscribedWith(subscription: PushSubscription, publicKey: string): boolean {
  const key = subscription.options.applicationServerKey;
  if (!key) return false;
  const current = new Uint8Array(key);
  const expected = keyToBytes(publicKey);
  return (
    current.length === expected.length && current.every((byte, index) => byte === expected[index])
  );
}

// A inscrição deste aparelho, se ele recebe push com a chave da API. Null se não recebe.
export async function getDeviceSubscription(publicKey: string): Promise<PushSubscription | null> {
  if (!isPushSupported() || Notification.permission !== 'granted') return null;
  const registration = await readyRegistration();
  const subscription = await registration.pushManager.getSubscription();
  return subscription && isSubscribedWith(subscription, publicKey) ? subscription : null;
}

// Pede a permissão (precisa vir de um toque da pessoa) e inscreve o aparelho. Null se a
// pessoa não permitiu.
export async function subscribeDevice(publicKey: string): Promise<PushSubscription | null> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await readyRegistration();
  const current = await registration.pushManager.getSubscription();
  if (current && isSubscribedWith(current, publicKey)) return current;
  // Inscrito com uma chave antiga: começa de novo com a atual.
  await current?.unsubscribe();
  return withTimeout(
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyToBytes(publicKey),
    }),
    SUBSCRIBE_TIMEOUT_MS,
    'O serviço de push não respondeu',
  );
}

// Desinscreve o aparelho. Devolve o endpoint que estava inscrito, para a API apagar.
export async function unsubscribeDevice(): Promise<string | null> {
  if (!isPushSupported()) return null;
  const registration = await readyRegistration();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return null;
  await subscription.unsubscribe();
  return subscription.endpoint;
}

// O primeiro aviso, mostrado na hora em que a pessoa liga: a confirmação de que chega.
export async function showWelcomeNotification(partnerName: string | null) {
  const registration = await readyRegistration();
  await registration.showNotification('Notificações ligadas', {
    body: partnerName
      ? `Os avisos de ${partnerName} chegam aqui, mesmo com o app fechado.`
      : 'Os avisos da dupla chegam aqui, mesmo com o app fechado.',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: 'push-ligado',
    lang: 'pt-BR',
  });
}
