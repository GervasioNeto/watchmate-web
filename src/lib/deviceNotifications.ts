// O que o app mostra fora dele: o número no ícone (app instalado no iPhone e no computador;
// no Android o próprio sistema põe o pontinho) e os avisos na bandeja do celular. Tudo é
// conveniência: onde o navegador não tem, simplesmente não acontece.

type BadgingNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

export function setAppBadge(count: number) {
  const nav = navigator as BadgingNavigator;
  const update = count > 0 ? nav.setAppBadge?.(count) : nav.clearAppBadge?.();
  // Sem permissão de avisos (iPhone) ou fora do app instalado, o navegador recusa.
  update?.catch(() => undefined);
}

// Abriu "Entre vocês": os avisos do WatchMate que estavam na bandeja já foram vistos.
export async function clearDeliveredNotifications() {
  setAppBadge(0);
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    const notifications = (await registration?.getNotifications()) ?? [];
    for (const notification of notifications) notification.close();
  } catch {
    // Sem service worker (ou navegador sem a função): não há o que limpar.
  }
}
