// O WatchMate instalado como app (PWA): o service worker (public/sw.js) e o pedido de
// instalação. `setupPwa` roda uma vez, antes do React: o navegador avisa que dá para
// instalar logo que a página carrega, e o aviso não se repete.

// O evento do Chrome que permite abrir o pedido de instalação quando quisermos.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface InstallState {
  // Guardado até a pessoa tocar em "Instalar". Só serve uma vez.
  promptEvent: BeforeInstallPromptEvent | null;
  // Aberto como app agora, ou instalado nesta visita.
  isInstalled: boolean;
}

let installState: InstallState = { promptEvent: null, isInstalled: false };
const listeners = new Set<() => void>();

function setInstallState(next: Partial<InstallState>) {
  installState = { ...installState, ...next };
  listeners.forEach((listener) => listener());
}

export function setupPwa() {
  installState = { ...installState, isInstalled: isStandalone() };

  window.addEventListener('beforeinstallprompt', (event) => {
    setInstallState({ promptEvent: event as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => {
    setInstallState({ promptEvent: null, isInstalled: true });
  });

  // Em desenvolvimento ele só atrapalharia: o Vite troca os arquivos a cada edição.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.error('Não foi possível registrar o service worker', error);
      });
    });
  }
}

export function subscribeInstallState(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getInstallState(): InstallState {
  return installState;
}

// Abre o pedido do navegador. Devolve se a pessoa aceitou.
export async function promptInstall(): Promise<boolean> {
  const event = installState.promptEvent;
  if (!event) return false;
  await event.prompt();
  const { outcome } = await event.userChoice;
  setInstallState({ promptEvent: null });
  return outcome === 'accepted';
}

// Aberto pelo ícone do app (sem a barra do navegador). O Safari do iPhone usa a sua
// própria propriedade em vez do display-mode.
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// iPhone e iPad: lá não existe pedido de instalação, só o "Adicionar à Tela de Início".
// O iPad se apresenta como Mac; o toque denuncia.
export function isAppleMobile(): boolean {
  const { userAgent, maxTouchPoints } = navigator;
  return (
    /iPhone|iPad|iPod/.test(userAgent) || (userAgent.includes('Macintosh') && maxTouchPoints > 1)
  );
}
