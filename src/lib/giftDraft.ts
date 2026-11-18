import { MAX_VOUCHERS, toDayString } from '@/lib/gifts';
import type { CreateGiftInput, Gift, GiftOccasion, GiftWrap } from '@/types/api';

// O presente sendo montado, antes de ir para a API. Tudo aqui é puro (rascunho entra,
// rascunho sai): a folha de montar só guarda o estado e desenha.

export interface DraftVoucher {
  text: string;
  emoji: string;
}

export interface GiftDraft {
  occasion: GiftOccasion;
  wrap: GiftWrap;
  message: string;
  vouchers: DraftVoucher[];
  when: 'now' | 'scheduled';
  // "2026-12-17" e "00:00", no fuso do celular (o formato dos campos de data e hora).
  date: string;
  time: string;
}

// Folga contra o relógio do celular adiantado: agendar para daqui a menos de um minuto é o
// mesmo que mandar agora.
const MIN_AHEAD_MS = 60 * 1000;
// A API aceita até 400 dias; aqui fica um pouco antes, para não brigar na fronteira.
const MAX_AHEAD_MS = 395 * 24 * 3600 * 1000;

// Um presente novo sai agora. Agendar é opcional: o campo de data já vem com amanhã, à
// meia-noite (a surpresa que espera o dia virar).
export function newDraft(now: Date): GiftDraft {
  return {
    occasion: 'just-because',
    wrap: 'passion',
    message: '',
    vouchers: [],
    when: 'now',
    date: toDayString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)),
    time: '00:00',
  };
}

// A hora agendada, ou null se os campos não formam uma data válida no futuro.
export function scheduledAt(draft: GiftDraft, now: Date): Date | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(draft.date);
  const time = /^(\d{2}):(\d{2})$/.exec(draft.time);
  if (!day || !time) return null;
  const at = new Date(
    Number(day[1]),
    Number(day[2]) - 1,
    Number(day[3]),
    Number(time[1]),
    Number(time[2]),
  );
  const ahead = at.getTime() - now.getTime();
  return ahead > MIN_AHEAD_MS && ahead < MAX_AHEAD_MS ? at : null;
}

// O vale como vai para o presente: sem espaço sobrando nem quebra de linha.
export function cleanVoucherText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function hasVoucher(draft: GiftDraft, text: string): boolean {
  return draft.vouchers.some((voucher) => voucher.text === text);
}

export function isFull(draft: GiftDraft): boolean {
  return draft.vouchers.length >= MAX_VOUCHERS;
}

// Põe o vale (se couber e ainda não estiver lá). O mesmo rascunho volta se não der.
export function addVoucher(draft: GiftDraft, voucher: DraftVoucher): GiftDraft {
  const text = cleanVoucherText(voucher.text);
  if (!text || isFull(draft) || hasVoucher(draft, text)) return draft;
  return { ...draft, vouchers: [...draft.vouchers, { text, emoji: voucher.emoji }] };
}

export function removeVoucher(draft: GiftDraft, text: string): GiftDraft {
  return { ...draft, vouchers: draft.vouchers.filter((voucher) => voucher.text !== text) };
}

export function toggleVoucher(draft: GiftDraft, voucher: DraftVoucher): GiftDraft {
  return hasVoucher(draft, voucher.text)
    ? removeVoucher(draft, voucher.text)
    : addVoucher(draft, voucher);
}

// O pedido para a API, ou null se ainda falta algo (a carta, ou uma hora que vai chegar).
export function toCreateInput(
  draft: GiftDraft,
  now: Date,
  timeZone: string,
): CreateGiftInput | null {
  const message = draft.message.trim();
  const at = draft.when === 'scheduled' ? scheduledAt(draft, now) : null;
  if (!message || (draft.when === 'scheduled' && !at)) return null;
  return {
    occasion: draft.occasion,
    wrap: draft.wrap,
    message,
    deliverAt: at?.toISOString() ?? null,
    vouchers: draft.vouchers,
    timeZone,
  };
}

// O presente como vai chegar, já destrancado: é o que a prévia "Ver como chega" abre. Nada
// disso vai para a API.
export function toPreviewGift(
  draft: GiftDraft,
  now: Date,
  people: { fromId: string; toId: string },
): Gift {
  return {
    id: 'preview',
    fromId: people.fromId,
    toId: people.toId,
    occasion: draft.occasion,
    wrap: draft.wrap,
    message: draft.message.trim(),
    deliverAt: now.toISOString(),
    delivered: true,
    openedAt: null,
    reaction: null,
    reactedAt: null,
    vouchers: draft.vouchers.map((voucher, index) => ({
      id: `preview-${index}`,
      text: voucher.text,
      emoji: voucher.emoji,
      usedAt: null,
    })),
    createdAt: now.toISOString(),
  };
}
