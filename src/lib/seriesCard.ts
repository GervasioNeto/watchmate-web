import {
  getLatestAired,
  getUpcoming,
  hasAired,
  isAwaitingPremiere,
  parseAirDate,
} from '@/lib/airing';
import { calendarDaysUntil } from '@/lib/dates';
import { getCoupleInterest, type CoupleInterest } from '@/lib/interest';
import type { Person } from '@/lib/people';
import { comparePositions, getMember, getNextPosition } from '@/lib/progress';
import { getSeasonTrack, type SeasonTrack } from '@/lib/seasonTrack';
import { isOngoing } from '@/lib/seriesStatus';
import type { EpisodePosition, SeriesProgress, TrackedSeries } from '@/types/api';

// Por quantos dias um episódio que saiu ainda conta como novo.
const NEW_EPISODE_DAYS = 7;

// A linha embaixo do título. Aqui fica o que dizer; o texto fica no card.
export type CardStatus =
  // "Próximo: T1 · E5"
  | { kind: 'next'; position: EpisodePosition }
  // "Novo: T1 · E9", com o pontinho no pôster
  | { kind: 'new-episode'; position: EpisodePosition }
  // "Próximo sai sexta": você viu tudo o que já saiu
  | { kind: 'upcoming'; date: Date }
  // "Em dia": viu tudo e o próximo ainda não tem data
  | { kind: 'caught-up' }
  // "Vocês terminaram" / "Você terminou"
  | { kind: 'finished'; together: boolean }
  // "Estreia sexta": ninguém começou e nada saiu ainda
  | { kind: 'premiere'; date: Date }
  // "Ideia de Leila" / "Sua ideia": ninguém começou
  | { kind: 'idea'; person: Person }
  | { kind: 'not-started' };

export interface SeriesCardModel {
  // A temporada em contas; null enquanto ninguém começou (aí não há o que mostrar).
  track: SeasonTrack | null;
  // O selo no canto do pôster. Só quando um dos dois está à frente: se cada um viu algo
  // que o outro não viu, a trilha já mostra, e um "+N" de um lado só enganaria.
  ahead: { person: Person; count: number } | null;
  status: CardStatus;
  // "Quero ver": só enquanto ninguém começou, que é quando a série está na fila.
  interest: CoupleInterest | null;
}

function whoIsAhead(
  progress: SeriesProgress,
  me: Person,
  partner: Person | null,
): SeriesCardModel['ahead'] {
  if (!partner) return null;
  const mine = getMember(progress, me.id)?.aFrente ?? 0;
  const theirs = getMember(progress, partner.id)?.aFrente ?? 0;
  if (mine > 0 && theirs === 0) return { person: me, count: mine };
  if (theirs > 0 && mine === 0) return { person: partner, count: theirs };
  return null;
}

// Saiu episódio novo para você: o mais recente foi ao ar nos últimos dias, é da temporada
// do seu próximo e você ainda não chegou nele. Quem está maratonando uma temporada antiga
// não recebe o aviso; quem terminou a anterior e viu a nova estrear, sim.
function isNewEpisode(series: TrackedSeries, next: EpisodePosition, now: Date): boolean {
  const latest = getLatestAired(series, now);
  const date = parseAirDate(latest?.dataExibicao ?? null);
  if (!latest || !date) return false;
  return (
    -calendarDaysUntil(date, now) < NEW_EPISODE_DAYS &&
    latest.temporada === next.temporada &&
    comparePositions(next, latest) <= 0
  );
}

function notStartedStatus(
  series: TrackedSeries,
  me: Person,
  partner: Person | null,
  now: Date,
): CardStatus {
  const upcoming = getUpcoming(series, now);
  if (upcoming && isAwaitingPremiere(series, now)) return { kind: 'premiere', date: upcoming.date };
  // Sozinho no grupo, toda série é ideia sua: "Ideia de" só faz sentido com par.
  const addedBy = partner && [me, partner].find((person) => person.id === series.adicionadoPor);
  return addedBy ? { kind: 'idea', person: addedBy } : { kind: 'not-started' };
}

// Sempre do seu ponto de vista: o que vem a seguir para você.
function watchingStatus(
  series: TrackedSeries,
  progress: SeriesProgress,
  me: Person,
  partner: Person | null,
  now: Date,
): CardStatus {
  const nextFor = (person: Person) =>
    getNextPosition(getMember(progress, person.id)?.posicaoAtual ?? null, series.temporadas);

  const next = nextFor(me);
  if (next && hasAired(series, next, now)) {
    return isNewEpisode(series, next, now)
      ? { kind: 'new-episode', position: next }
      : { kind: 'next', position: next };
  }

  // Você viu tudo o que já saiu.
  const upcoming = getUpcoming(series, now);
  if (upcoming) return { kind: 'upcoming', date: upcoming.date };
  if (next || isOngoing(series.status)) return { kind: 'caught-up' };
  return { kind: 'finished', together: !!partner && nextFor(partner) === null };
}

function hasStarted(progress: SeriesProgress): boolean {
  return progress.membros.some((member) => member.assistidos > 0);
}

// Também decide em que bloco da lista a série entra (ver listOrder.ts): card e bloco
// nunca discordam.
export function getCardStatus(
  series: TrackedSeries,
  progress: SeriesProgress,
  me: Person,
  partner: Person | null,
  now: Date,
): CardStatus {
  return hasStarted(progress)
    ? watchingStatus(series, progress, me, partner, now)
    : notStartedStatus(series, me, partner, now);
}

export function describeSeriesCard(
  series: TrackedSeries,
  progress: SeriesProgress,
  me: Person,
  partner: Person | null,
  now: Date,
): SeriesCardModel {
  const started = hasStarted(progress);
  return {
    track: started ? getSeasonTrack(series, progress, me.id, partner?.id ?? null, now) : null,
    ahead: whoIsAhead(progress, me, partner),
    status: getCardStatus(series, progress, me, partner, now),
    interest: started ? null : getCoupleInterest(series, me, partner),
  };
}
