import { useSyncExternalStore } from 'react';
import { getInstallState, isAppleMobile, promptInstall, subscribeInstallState } from '@/lib/pwa';

// Como o WatchMate vira app neste aparelho:
// - installed: já está aberto como app (ou acabou de ser instalado);
// - prompt: o navegador tem o pedido de instalação (Android, Chrome e Edge no computador);
// - ios: iPhone e iPad, onde só existe o "Adicionar à Tela de Início" do Safari;
// - unavailable: o navegador não instala sites, ou o app já está instalado e foi aberto
//   pelo navegador (nesse caso o Chrome não oferece de novo).
export type InstallMode = 'installed' | 'prompt' | 'ios' | 'unavailable';

export function useInstallApp() {
  const { isInstalled, promptEvent } = useSyncExternalStore(subscribeInstallState, getInstallState);

  const mode: InstallMode = isInstalled
    ? 'installed'
    : promptEvent
      ? 'prompt'
      : isAppleMobile()
        ? 'ios'
        : 'unavailable';

  return { mode, install: promptInstall };
}
