import { useSyncExternalStore } from 'react';

// Qual presente recebido alguém pediu para ver (tocar na lista, um aviso). Quem mostra é
// sempre o GiftRevealHost, um só para o app inteiro: assim dois pedidos (o automático e o da
// lista) nunca abrem duas surpresas uma por cima da outra.

let requested: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function requestGiftReveal(giftId: string) {
  requested = giftId;
  emit();
}

export function dismissGiftReveal() {
  requested = null;
  emit();
}

export function useRequestedGiftReveal(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => requested,
    () => null,
  );
}
