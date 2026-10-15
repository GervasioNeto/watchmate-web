import { hasAired } from '@/lib/airing';
import type { DayKind } from '@/lib/coupleActivity';
import {
  comparePositions,
  episodeKey,
  getEpisodeWatchStatus,
  getMember,
  getNextPosition,
  getPlayableSeasons,
  getSeasonTotal,
  indexEpisodes,
} from '@/lib/progress';
import type { EpisodeProgressEntry, SeriesProgress, TrackedSeries } from '@/types/api';

// Como um episódio é pintado na trilha: com as mesmas cores dos dias na página da dupla
// (ver dayKind), mais `unaired` para o que ainda não foi ao ar.
export type EpisodeKind = DayKind | 'unaired';

export interface SeasonTrack {
  season: number;
  // Um por episódio da temporada, em ordem.
  episodes: EpisodeKind[];
}

// Juntos só quando os dois marcaram como juntos, como na atividade e na pílula do episódio.
function episodeKind(
  entry: EpisodeProgressEntry | undefined,
  meId: string,
  partnerId: string | null,
): DayKind {
  const { me, partner } = getEpisodeWatchStatus(entry, meId, partnerId);
  if (me && partner) return me.juntos && partner.juntos ? 'together' : 'split';
  if (me) return 'me';
  if (partner) return 'partner';
  return 'empty';
}

// A temporada do próximo episódio de quem está mais atrás. Com os dois no mesmo ponto, é
// onde vocês estão; quando um se adiantou, é onde a dupla se separou, e o que um viu sem
// o outro aparece ali. Com os dois no fim, a última temporada.
function trackSeason(
  series: TrackedSeries,
  progress: SeriesProgress,
  memberIds: string[],
): number | null {
  const [earliest] = memberIds
    .map((id) => getNextPosition(getMember(progress, id)?.posicaoAtual ?? null, series.temporadas))
    .filter((position) => position !== null)
    .sort(comparePositions);
  if (earliest) return earliest.temporada;
  const seasons = getPlayableSeasons(series.temporadas).filter((season) => season.numero !== 0);
  return seasons.at(-1)?.numero ?? null;
}

export function getSeasonTrack(
  series: TrackedSeries,
  progress: SeriesProgress,
  meId: string,
  partnerId: string | null,
  now: Date,
): SeasonTrack | null {
  const season = trackSeason(series, progress, partnerId ? [meId, partnerId] : [meId]);
  const total = season === null ? null : getSeasonTotal(series.temporadas, season);
  if (season === null || !total) return null;

  const byKey = indexEpisodes(progress);
  const episodes = Array.from({ length: total }, (_, index): EpisodeKind => {
    const episodio = index + 1;
    const kind = episodeKind(byKey.get(episodeKey(season, episodio)), meId, partnerId);
    // Marcado vale mais que a data do TMDB: só o que ninguém viu pode estar "por sair".
    if (kind === 'empty' && !hasAired(series, { temporada: season, episodio }, now)) {
      return 'unaired';
    }
    return kind;
  });
  return { season, episodes };
}

export interface TrackRun {
  kind: EpisodeKind;
  count: number;
}

// Episódios seguidos do mesmo jeito viram um trecho só.
export function toRuns(episodes: EpisodeKind[]): TrackRun[] {
  const runs: TrackRun[] = [];
  for (const kind of episodes) {
    const last = runs.at(-1);
    if (last?.kind === kind) last.count++;
    else runs.push({ kind, count: 1 });
  }
  return runs;
}

// "Temporada 2: 4 juntos, 2 só Leila, 3 por ver" — para leitor de tela e dica.
export function describeTrack(track: SeasonTrack, partnerName: string | null): string {
  const count = (kind: EpisodeKind) => track.episodes.filter((item) => item === kind).length;
  const unaired = count('unaired');
  const parts = [
    count('together') ? `${count('together')} juntos` : null,
    count('split') ? `${count('split')} cada um na sua hora` : null,
    count('me') ? `${count('me')} só você` : null,
    count('partner') && partnerName ? `${count('partner')} só ${partnerName}` : null,
    count('empty') ? `${count('empty')} por ver` : null,
    unaired ? `${unaired} ainda não ${unaired === 1 ? 'saiu' : 'saíram'}` : null,
  ].filter(Boolean);
  return `Temporada ${track.season}: ${parts.join(', ')}`;
}
