import type { GiftOccasion, GiftWrap } from '@/types/api';

// O que um presente pode ter. As mesmas listas da API (src/gifts/catalog.ts no
// watchmate-api), que confere tudo antes de guardar.

export interface OccasionMeta {
  key: GiftOccasion;
  label: string;
  emoji: string;
  // O título grande na hora de abrir.
  headline: string;
}

export const OCCASIONS: readonly OccasionMeta[] = [
  {
    key: 'anniversary',
    label: 'Aniversário de namoro',
    emoji: '💞',
    headline: 'Feliz aniversário de namoro',
  },
  {
    key: 'valentines',
    label: 'Dia dos Namorados',
    emoji: '💘',
    headline: 'Feliz Dia dos Namorados',
  },
  { key: 'just-because', label: 'Só porque sim', emoji: '🎁', headline: 'Um presentinho pra você' },
];

export function occasionOf(key: GiftOccasion): OccasionMeta {
  return OCCASIONS.find((occasion) => occasion.key === key) ?? OCCASIONS[OCCASIONS.length - 1];
}

// Cada embrulho é uma paleta: o papel (e o tom escuro da lateral), a fita, o brilho atrás da
// caixa e as cores dos corações que explodem. As cores vão para o SVG e para o canvas dos
// corações, por isso são valores, e não classes.
export interface WrapTheme {
  key: GiftWrap;
  label: string;
  paper: string;
  paperShade: string;
  ribbon: string;
  glow: string;
  hearts: readonly string[];
}

export const WRAPS: readonly WrapTheme[] = [
  {
    key: 'passion',
    label: 'Paixão',
    paper: '#ff4f7b',
    paperShade: '#d63862',
    ribbon: '#ffe4ec',
    glow: 'rgb(255 79 123 / 0.5)',
    hearts: ['#ff4f7b', '#ff86a6', '#ffc2d2', '#ff2e63', '#fff1f5'],
  },
  {
    key: 'flame',
    label: 'WatchMate',
    paper: '#ff5400',
    paperShade: '#d64600',
    ribbon: '#ffe6d6',
    glow: 'rgb(255 84 0 / 0.45)',
    hearts: ['#ff5400', '#ff8a4c', '#ffc4a3', '#ff4f7b', '#fff1e8'],
  },
  {
    key: 'night',
    label: 'Meia-noite',
    paper: '#7c4dff',
    paperShade: '#5c32d9',
    ribbon: '#ffd9f3',
    glow: 'rgb(124 77 255 / 0.5)',
    hearts: ['#9d68f3', '#c58bff', '#ff9ecf', '#ff5cc8', '#f6eeff'],
  },
];

// O coração dos desenhos do presente (24×24): o mesmo traçado no papel da caixa, no selo da
// carta e nos corações que explodem.
export const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

export function wrapOf(key: GiftWrap): WrapTheme {
  return WRAPS.find((wrap) => wrap.key === key) ?? WRAPS[0];
}

// Vales prontos, com a cara do WatchMate. O texto vai sem o "Vale": o ingresso já diz VALE.
export const VOUCHER_PRESETS = [
  { emoji: '🎬', text: 'Escolher a próxima série' },
  { emoji: '🍿', text: 'Uma maratona com pipoca' },
  { emoji: '🔁', text: 'Rever aquele episódio' },
  { emoji: '🍝', text: 'Um jantar antes do episódio' },
  { emoji: '💆', text: 'Cafuné durante a série' },
  { emoji: '🫂', text: 'Um abraço bem demorado' },
] as const;

// Para o vale escrito à mão.
export const VOUCHER_EMOJIS = ['🎟️', '💋', '🌹', '🍕', '🧁', '💌', '🛋️', '✨'] as const;

export const GIFT_REACTIONS = ['❤️', '🥹', '😍', '😭', '🫶'] as const;

export const MESSAGE_MAX_LENGTH = 600;
export const VOUCHER_TEXT_MAX_LENGTH = 60;
export const MAX_VOUCHERS = 3;

// ---------- quando entregar ----------

// "2026-11-18", no fuso do celular (o formato do campo de data).
export function toDayString(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// A hora de uma entrega: "à meia-noite", "ao meio-dia", "às 9h", "às 21h30".
export function formatDeliveryTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours === 0 && minutes === 0) return 'à meia-noite';
  if (hours === 12 && minutes === 0) return 'ao meio-dia';
  const time = minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, '0')}`;
  return `${hours <= 1 ? 'à' : 'às'} ${time}`;
}

// Dias de calendário de `from` até `to`, no fuso do celular: amanhã é 1.
function calendarDaysBetween(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000));
}

// Quando um presente trancado abre, como o push diz (lib/zonedTime na API): "hoje às 21h",
// "amanhã à meia-noite", "sábado às 20h", "dia 17 de dez. à meia-noite".
export function formatOpening(at: Date, now: Date): string {
  const days = calendarDaysBetween(now, at);
  const time = formatDeliveryTime(at);
  if (days <= 0) return `hoje ${time}`;
  if (days === 1) return `amanhã ${time}`;
  if (days < 7) {
    return `${at.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '')} ${time}`;
  }
  return `dia ${at.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} ${time}`;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// O que falta, em partes inteiras (arredondado para cima no segundo: 0 só quando chegou).
export function splitCountdown(ms: number): CountdownParts {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

// O que falta, curto, para uma linha de lista: "2d 14h", "3h 20min", "12 min", "1 min".
export function formatCountdownShort(ms: number): string {
  const { days, hours, minutes } = splitCountdown(ms);
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  return `${Math.max(1, minutes)} min`;
}

// O que falta, por extenso, para o leitor de tela: "2 dias, 14 horas e 5 minutos".
export function describeCountdown(ms: number): string {
  const { days, hours, minutes } = splitCountdown(ms);
  const parts = [
    days > 0 && `${days} ${days === 1 ? 'dia' : 'dias'}`,
    hours > 0 && `${hours} ${hours === 1 ? 'hora' : 'horas'}`,
    minutes > 0 && `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`,
  ].filter((part): part is string => !!part);
  if (parts.length === 0) return 'menos de um minuto';
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} e ${parts.at(-1)}`;
}
