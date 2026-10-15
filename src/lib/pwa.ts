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
  // O app está instalado neste aparelho (aberto como app agora ou não).
  isInstalled: boolean;
  // Aberto pelo ícone do app agora, e não numa aba do navegador.
  isStandalone: boolean;
}

let installState: InstallState = { promptEvent: null, isInstalled: false, isStandalone: false };
const listeners = new Set<() => void>();

function setInstallState(next: Partial<InstallState>) {
  installState = { ...installState, ...next };
  listeners.forEach((listener) => listener());
}

// O navegador não conta ao site que o app já está instalado. Então o próprio app anota,
// neste aparelho, quando é instalado ou aberto como app: quem depois abre o site numa aba
// continua vendo "Instalado". No Android, o app e o Chrome dividem esse armazenamento. Se a
// pessoa desinstalar, o Chrome volta a oferecer a instalação, e a anotação é apagada.
const INSTALLED_KEY = 'watchmate:app-instalado';

function rememberInstalled(installed: boolean) {
  try {
    if (installed) localStorage.setItem(INSTALLED_KEY, '1');
    else localStorage.removeItem(INSTALLED_KEY);
  } catch {
    // Armazenamento bloqueado (aba anônima, por exemplo): só não lembra.
  }
}

function wasInstalled(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setupPwa() {
  const standalone = isStandalone();
  if (standalone) rememberInstalled(true);
  installState = {
    ...installState,
    isInstalled: standalone || wasInstalled(),
    isStandalone: standalone,
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    rememberInstalled(false);
    setInstallState({ promptEvent: event as BeforeInstallPromptEvent, isInstalled: false });
  });
  window.addEventListener('appinstalled', () => {
    rememberInstalled(true);
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
