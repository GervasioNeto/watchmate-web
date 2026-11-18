import { useState } from 'react';
import { GiftReveal } from '@/components/gifts/GiftReveal';
import { useCouple } from '@/hooks/useCouple';
import { dismissGiftReveal, useRequestedGiftReveal } from '@/hooks/useGiftReveal';
import { useGifts } from '@/hooks/useGifts';
import type { Gift } from '@/types/api';

// O presente trancado aparece sozinho uma vez por aparelho (o "olha o que te espera"); depois
// fica na Dupla, com a contagem, até a hora de abrir.
const TEASER_PREFIX = 'watchmate:presente-visto:';

function sawTeaser(giftId: string): boolean {
  try {
    return localStorage.getItem(TEASER_PREFIX + giftId) !== null;
  } catch {
    return false;
  }
}

function markTeaserSeen(giftId: string) {
  try {
    localStorage.setItem(TEASER_PREFIX + giftId, '1');
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): o trancado só aparece de novo na próxima vez.
  }
}

// Os que já podem abrir vêm antes dos trancados; entre eles, o mais antigo primeiro.
function byArrival(a: Gift, b: Gift): number {
  return Number(b.delivered) - Number(a.delivered) || a.deliverAt.localeCompare(b.deliverAt);
}

// A surpresa do presente, uma só para o app inteiro. Mostra:
// - o presente que alguém pediu para ver (tocar na lista da Dupla, um aviso), na frente de tudo;
// - sozinho, assim que o app abre, em qualquer página: um presente pronto que você ainda não
//   abriu (não depende do push: um aviso apagado ou desligado não estraga nada), ou um trancado
//   que você ainda não viu neste aparelho.
// "Abrir depois" adia até a próxima vez que o app abrir. Dois esperando? Um de cada vez.
export function GiftRevealHost() {
  const { partner, byId } = useCouple();
  const { data } = useGifts(!!partner);
  const requestedId = useRequestedGiftReveal();
  const [showingId, setShowingId] = useState<string | null>(null);
  const [later, setLater] = useState<ReadonlySet<string>>(() => new Set());

  const received = data?.received ?? [];
  const find = (id: string | null) =>
    id ? (received.find((gift) => gift.id === id) ?? null) : null;
  const requested = find(requestedId);
  const showing = requested ?? find(showingId);
  const next = received
    .filter(
      (gift) => !gift.openedAt && !later.has(gift.id) && (gift.delivered || !sawTeaser(gift.id)),
    )
    .sort(byArrival)[0];

  if (!showing && next) {
    setShowingId(next.id);
    return null;
  }
  if (!showing) return null;

  function close(gift: Gift) {
    // Trancado: já viu, não volta sozinho até destrancar (aí volta, pronto para abrir).
    if (!gift.delivered) markTeaserSeen(gift.id);
    // Pronto e não aberto: "Abrir depois".
    else if (!gift.openedAt) setLater((current) => new Set(current).add(gift.id));
    if (requestedId === gift.id) dismissGiftReveal();
    setShowingId(null);
  }

  return (
    <GiftReveal gift={showing} from={byId(showing.fromId)} open onClose={() => close(showing)} />
  );
}
