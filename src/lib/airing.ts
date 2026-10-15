import { calendarDaysUntil } from '@/lib/dates';
import { comparePositions } from '@/lib/progress';
import type { AiringEpisode, EpisodePosition, TrackedSeries } from '@/types/api';

// O que se sabe sobre a exibição de uma série vem do snapshot do TMDB, que a API renova
// a cada poucas horas enquanto a série está no ar. Sem essa informação (série que a API
// ainda não renovou), tudo conta como exibido, que é como o app sempre funcionou.

// '2026-10-16' → meia-noite local desse dia. `new Date('2026-10-16')` seria meia-noite
// UTC, que no Brasil ainda é o dia 15.
export function parseAirDate(value: string | null): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

// O próximo agendado já saiu se o dia dele chegou: o snapshot pode ter algumas horas.
function hasArrived(episode: AiringEpisode, now: Date): boolean {
  const date = parseAirDate(episode.dataExibicao);
  return date !== null && calendarDaysUntil(date, now) <= 0;
}

export function hasAired(series: TrackedSeries, position: EpisodePosition, now: Date): boolean {
  const { proximoEpisodio: next, ultimoEpisodioExibido: last } = series;
  if (next) {
    const order = comparePositions(position, next);
    return order < 0 || (order === 0 && hasArrived(next, now));
  }
  if (last) return comparePositions(position, last) <= 0;
  return true;
}

// O episódio mais recente que já saiu.
export function getLatestAired(series: TrackedSeries, now: Date): AiringEpisode | null {
  const next = series.proximoEpisodio;
  return next && hasArrived(next, now) ? next : series.ultimoEpisodioExibido;
}

// O próximo que ainda vai sair, quando tem data marcada.
export function getUpcoming(
  series: TrackedSeries,
  now: Date,
): { episode: AiringEpisode; date: Date } | null {
  const next = series.proximoEpisodio;
  const date = parseAirDate(next?.dataExibicao ?? null);
  return next && date && calendarDaysUntil(date, now) > 0 ? { episode: next, date } : null;
}

// Ainda não estreou: nada saiu e o primeiro episódio tem data marcada.
export function isAwaitingPremiere(series: TrackedSeries, now: Date): boolean {
  return !series.ultimoEpisodioExibido && getUpcoming(series, now) !== null;
}
