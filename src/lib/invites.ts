import { addDays, calendarDaysUntil, startOfDay } from '@/lib/dates';
import type { Invite } from '@/types/api';

// As frases prontas do convite. As mesmas da API (src/invites/phrases.ts no watchmate-api),
// que só aceita estas: o convite é um toque rápido, não uma mensagem.
export const INVITE_PHRASES = [
  'Pipoca pronta 🍿',
  'Tô no sofá te esperando 🛋️',
  'Não vale ver sem mim 👀',
  'Preciso saber o que acontece 😭',
  'Só mais um, prometo',
] as const;

// Os horários prontos do "Bora?" são as noites, quando vocês costumam ver.
const EVENING_HOURS = [19, 20, 21, 22, 23];
const TOMORROW_HOURS = [20, 21, 22];
// Um horário só vira opção se ainda dá tempo de o par ver o convite e se arrumar.
const MIN_LEAD_MS = 20 * 60 * 1000;
const MAX_SLOTS = 3;

export interface TimeChoice {
  value: string;
  label: string;
  // null é "agora".
  at: Date | null;
}

function atHour(day: Date, hour: number, minute = 0): Date {
  const date = new Date(day);
  date.setHours(hour, minute, 0, 0);
  return date;
}

// "21h", "21h30".
export function formatClock(date: Date): string {
  const minutes = date.getMinutes();
  return minutes === 0
    ? `${date.getHours()}h`
    : `${date.getHours()}h${String(minutes).padStart(2, '0')}`;
}

// "Agora" e os próximos horários da noite. Já tarde, entram os de amanhã.
export function getTimeChoices(now: Date): TimeChoice[] {
  const today = EVENING_HOURS.map((hour) => atHour(now, hour))
    .filter((date) => date.getTime() - now.getTime() >= MIN_LEAD_MS)
    .slice(0, MAX_SLOTS)
    .map((date) => ({ value: `today-${date.getHours()}`, label: formatClock(date), at: date }));
  const tomorrow = addDays(startOfDay(now), 1);
  const later = TOMORROW_HOURS.slice(0, MAX_SLOTS - today.length).map((hour) => ({
    value: `tomorrow-${hour}`,
    label: `Amanhã ${hour}h`,
    at: atHour(tomorrow, hour),
  }));
  return [{ value: 'now', label: 'Agora', at: null }, ...today, ...later];
}

// Outros horários para quem topa, mas não naquela hora: meia hora, uma e duas horas
// depois do combinado.
export function getRescheduleChoices(invite: Invite, now: Date): TimeChoice[] {
  const base = invite.at ? new Date(invite.at) : now;
  return [30, 60, 120]
    .map((minutes) => new Date(base.getTime() + minutes * 60 * 1000))
    .filter((date) => date.getTime() - now.getTime() >= 5 * 60 * 1000)
    .map((date) => ({
      value: date.toISOString(),
      label: calendarDaysUntil(date, now) === 0 ? formatClock(date) : `Amanhã ${formatClock(date)}`,
      at: date,
    }));
}

// O que veio do campo de hora ("21:30"): hoje, ou amanhã se essa hora já passou.
export function timeInputToDate(value: string, now: Date): Date | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const today = atHour(now, Number(match[1]), Number(match[2]));
  return today.getTime() > now.getTime() + 60 * 1000 ? today : addDays(today, 1);
}

// O que está escolhido no seletor de hora (ver SessionTimePicker).
export const CUSTOM_TIME = 'custom';

export interface SessionTimeDraft {
  // As opções da hora em que a folha abriu: não mudam com ela aberta.
  choices: TimeChoice[];
  // O `value` de uma opção, ou CUSTOM_TIME.
  selected: string;
  // O campo "Outro" ("21:30").
  custom: string;
}

// A hora escolhida: null é "agora"; undefined, um "Outro" ainda sem hora válida.
export function resolveSessionTime(draft: SessionTimeDraft, now: Date): Date | null | undefined {
  if (draft.selected === CUSTOM_TIME) return timeInputToDate(draft.custom, now) ?? undefined;
  return draft.choices.find((choice) => choice.value === draft.selected)?.at ?? null;
}

// A próxima hora cheia, para o "Outro" já abrir com algo perto do que a pessoa quer.
export function nextFullHour(now: Date): string {
  return `${String((now.getHours() + 1) % 24).padStart(2, '0')}:00`;
}

// "às 21h", "à 1h", "à meia-noite", "ao meio-dia".
function atTime(date: Date): string {
  const hour = date.getHours();
  if (date.getMinutes() === 0 && hour === 0) return 'à meia-noite';
  if (date.getMinutes() === 0 && hour === 12) return 'ao meio-dia';
  return `${hour <= 1 ? 'à' : 'às'} ${formatClock(date)}`;
}

function weekday(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '');
}

// Para frases: "agora", "hoje às 21h", "amanhã à 1h", "sábado às 20h". A mesma regra do
// push (que sai da API no fuso de quem chamou); aqui vale o fuso do celular.
export function describeInviteTime(at: string | null, now: Date): string {
  if (!at) return 'agora';
  const date = new Date(at);
  const days = calendarDaysUntil(date, now);
  if (days === 0) return `hoje ${atTime(date)}`;
  if (days === 1) return `amanhã ${atTime(date)}`;
  if (days === -1) return `ontem ${atTime(date)}`;
  return `${weekday(date)} ${atTime(date)}`;
}

// Para o ingresso, em dois pedaços: o dia ("Hoje") e a hora ("21h"). "Agora" não tem dia.
export function describeSession(
  at: string | null,
  now: Date,
): { day: string | null; time: string } {
  if (!at) return { day: null, time: 'Agora' };
  const date = new Date(at);
  const days = calendarDaysUntil(date, now);
  const day =
    days === 0
      ? 'Hoje'
      : days === 1
        ? 'Amanhã'
        : days === -1
          ? 'Ontem'
          : weekday(date).replace(/^./, (letter) => letter.toUpperCase());
  return { day, time: formatClock(date) };
}

// Quanto falta para uma sessão confirmada: "Começa em 40 min", "Começa em 1h20", "É agora!".
// Null quando ainda falta muito (o ingresso já mostra a hora).
export function describeCountdown(at: string | null, now: Date): string | null {
  if (!at) return 'É agora!';
  const minutes = Math.ceil((Date.parse(at) - now.getTime()) / 60000);
  if (minutes > 6 * 60) return null;
  if (minutes >= 60) {
    const rest = minutes % 60;
    return `Começa em ${Math.floor(minutes / 60)}h${rest ? String(rest).padStart(2, '0') : ''}`;
  }
  if (minutes >= 1) return `Começa em ${minutes} min`;
  return 'É agora!';
}

// O ingresso visto por quem olha. `invited`: chegou para você e espera resposta;
// `waiting`: você chamou e espera o par.
export type TicketState =
  'invited' | 'waiting' | 'confirmed' | 'done' | 'declined' | 'canceled' | 'expired';

export function getTicketState(invite: Invite, meId: string): TicketState {
  if (invite.fulfilled) return 'done';
  switch (invite.status) {
    case 'pending':
      return invite.toId === meId ? 'invited' : 'waiting';
    case 'accepted':
      return 'confirmed';
    default:
      return invite.status;
  }
}

// Ainda pode virar sessão: é o que fica no topo da lista.
export function isLiveInvite(invite: Invite | null | undefined): invite is Invite {
  return (
    !!invite && !invite.fulfilled && (invite.status === 'pending' || invite.status === 'accepted')
  );
}

// O fuso do celular ("America/Sao_Paulo"). A API usa para o push falar na hora de vocês.
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
}
