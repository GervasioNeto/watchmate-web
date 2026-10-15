import { useSyncExternalStore } from 'react';
import { getInstallState, isAppleMobile, promptInstall, subscribeInstallState } from '@/lib/pwa';

// Como o WatchMate vira app neste aparelho:
// - prompt: o navegador tem o pedido de instalação (Android, Chrome e Edge no computador);
// - installed: já está instalado (aberto como app agora ou numa aba do navegador);
// - ios: iPhone e iPad, onde só existe o "Adicionar à Tela de Início" do Safari;
// - unavailable: o navegador não instala sites.
// O pedido vem antes de "installed": se o navegador oferece instalar, o app não está lá.
export type InstallMode = 'installed' | 'prompt' | 'ios' | 'unavailable';

export function useInstallApp() {
  const { isInstalled, isStandalone, promptEvent } = useSyncExternalStore(
    subscribeInstallState,
    getInstallState,
  );

  const mode: InstallMode = promptEvent
    ? 'prompt'
    : isInstalled
      ? 'installed'
      : isAppleMobile()
        ? 'ios'
        : 'unavailable';

  return { mode, isStandalone, install: promptInstall };
}
