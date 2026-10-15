import { pluralEpisodes } from '@/lib/coupleSummary';
import { addDays, daysInMonth, isSameDay, startOfDay, startOfMonth } from '@/lib/dates';
import { comparePositions, formatEpisodeCode } from '@/lib/progress';
import type { ListEntry } from '@/lib/seriesFilters';
import type { EpisodePosition } from '@/types/api';

// O que aconteceu na lista: cada episódio visto vira um evento. Visto junto pelos dois
// é um evento só ("together"); visto por cada um em outro momento são dois.
export type WatchEventKind = 'together' | 'me' | 'partner';

export interface WatchEvent {
  kind: WatchEventKind;
  at: Date;
  seriesId: string;
  seriesName: string;
  position: EpisodePosition;
}

export interface ActivityContext {
  meId: string;
  partnerId: string | null;
}

// Todos os episódios vistos, do mais recente para o mais antigo.
export function collectWatchEvents(
  entries: ListEntry[],
  { meId, partnerId }: ActivityContext,
): WatchEvent[] {
  const events: WatchEvent[] = [];
  for (const { series, progress } of entries) {
    if (!progress) continue;
    for (const entry of progress.episodios) {
      const mine = entry.assistidoPor.find((watcher) => watcher.usuarioId === meId);
      const theirs = partnerId
        ? entry.assistidoPor.find((watcher) => watcher.usuarioId === partnerId)
        : undefined;
      const base = {
        seriesId: series.id,
        seriesName: series.nome,
        position: { temporada: entry.temporada, episodio: entry.episodio },
      };
      if (mine && theirs && mine.juntos && theirs.juntos) {
        events.push({ ...base, kind: 'together', at: new Date(mine.assistidoEm) });
        continue;
      }
      if (mine) events.push({ ...base, kind: 'me', at: new Date(mine.assistidoEm) });
      if (theirs) events.push({ ...base, kind: 'partner', at: new Date(theirs.assistidoEm) });
    }
  }
  return events.sort((a, b) => b.at.getTime() - a.at.getTime());
}

export interface DayActivity {
  // Meia-noite (fuso local) do dia.
  date: Date;
  together: number;
  me: number;
  partner: number;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Episódios por dia durante `count` dias a partir de `start`, no fuso de quem está olhando.
export function activityByDay(events: WatchEvent[], start: Date, count: number): DayActivity[] {
  const first = startOfDay(start);
  const days: DayActivity[] = Array.from({ length: count }, (_, index) => ({
    date: addDays(first, index),
    together: 0,
    me: 0,
    partner: 0,
  }));
  const byKey = new Map(days.map((day) => [dayKey(day.date), day]));
  for (const event of events) {
    const day = byKey.get(dayKey(event.at));
    if (day) day[event.kind]++;
  }
  return days;
}

// Os últimos 7 dias, do mais antigo até hoje.
export function lastSevenDays(events: WatchEvent[], now: Date): DayActivity[] {
  return activityByDay(events, addDays(now, -6), 7);
}

// Todos os dias do mês de `month`, do dia 1 ao último.
export function monthActivity(events: WatchEvent[], month: Date): DayActivity[] {
  return activityByDay(events, startOfMonth(month), daysInMonth(month));
}

export interface ActivityTotals {
  together: number;
  me: number;
  partner: number;
}

export function sumActivity(days: DayActivity[]): ActivityTotals {
  return days.reduce(
    (sum, day) => ({
      together: sum.together + day.together,
      me: sum.me + day.me,
      partner: sum.partner + day.partner,
    }),
    { together: 0, me: 0, partner: 0 },
  );
}

// Dias seguidos vendo juntos, contando de hoje para trás. Se hoje ainda não teve,
// a sequência que terminou ontem continua valendo (o dia não acabou).
export function togetherStreak(days: DayActivity[]): number {
  let index = days.length - 1;
  if (days[index]?.together === 0) index--;
  let streak = 0;
  while (index >= 0 && days[index].together > 0) {
    streak++;
    index--;
  }
  return streak;
}

// A maior sequência de dias seguidos vendo juntos dentro do período.
export function longestTogetherStreak(days: DayActivity[]): number {
  let longest = 0;
  let current = 0;
  for (const day of days) {
    current = day.together > 0 ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

// Como o dia é pintado: laranja quando viram juntos, metade de cada cor quando cada um
// viu na sua hora, a cor de quem viu quando foi só uma pessoa.
export type DayKind = 'empty' | 'together' | 'split' | 'me' | 'partner';

export function dayKind(day: DayActivity): DayKind {
  if (day.together > 0) return 'together';
  if (day.me > 0 && day.partner > 0) return 'split';
  if (day.me > 0) return 'me';
  if (day.partner > 0) return 'partner';
  return 'empty';
}

// "2 juntos, 1 você" — o que um dia teve, para leitores de tela e dicas.
export function describeDayCounts(day: DayActivity, partnerName: string | null): string {
  const parts = [
    day.together ? `${day.together} juntos` : null,
    day.me ? `${day.me} você` : null,
    day.partner && partnerName ? `${day.partner} ${partnerName}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : 'nenhum episódio';
}

// Uma linha da atividade recente: episódios seguidos da mesma série, vistos do mesmo
// jeito no mesmo dia, viram um item só (marcar a temporada inteira não vira 10 linhas).
export interface ActivityItem {
  kind: WatchEventKind;
  seriesId: string;
  seriesName: string;
  // O momento do episódio mais recente do grupo.
  at: Date;
  first: EpisodePosition;
  last: EpisodePosition;
  count: number;
}

// "T1 · E4–E6" quando são episódios seguidos da mesma temporada; senão, só a contagem.
export function formatActivityEpisodes({ first, last, count }: ActivityItem): string {
  if (count === 1) return formatEpisodeCode(first);
  const isRun = first.temporada === last.temporada && last.episodio - first.episodio + 1 === count;
  return isRun ? `${formatEpisodeCode(first)}–E${last.episodio}` : pluralEpisodes(count);
}

export function groupRecentActivity(events: WatchEvent[], limit: number): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const event of events) {
    const current = items.at(-1);
    if (
      current &&
      current.kind === event.kind &&
      current.seriesId === event.seriesId &&
      isSameDay(current.at, event.at)
    ) {
      current.count++;
      if (comparePositions(event.position, current.first) < 0) current.first = event.position;
      if (comparePositions(event.position, current.last) > 0) current.last = event.position;
      continue;
    }
    if (items.length === limit) break;
    items.push({
      kind: event.kind,
      seriesId: event.seriesId,
      seriesName: event.seriesName,
      at: event.at,
      first: event.position,
      last: event.position,
      count: 1,
    });
  }
  return items;
}
