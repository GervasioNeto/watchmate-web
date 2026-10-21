import type { Person } from '@/lib/people';
import type { EpisodeWatchStatus } from '@/lib/progress';
import type { EpisodeWatcher, SeriesProgress } from '@/types/api';

// Quem viu um episódio, na mesma regra de cor do calendário da dupla (ver DayDot):
// - together: os dois, juntos (o laranja do WatchMate);
// - apart: os dois, cada um na sua hora (metade de cada cor);
// - me / partner: só um viu (a cor de quem viu);
// - none: ninguém ainda.
export type EpisodeMarkKind = 'together' | 'apart' | 'me' | 'partner' | 'none';

export function getEpisodeMarkKind(status: EpisodeWatchStatus): EpisodeMarkKind {
  if (status.me && status.partner) {
    return status.me.juntos && status.partner.juntos ? 'together' : 'apart';
  }
  if (status.me) return 'me';
  if (status.partner) return 'partner';
  return 'none';
}

function shortDate(watcher: EpisodeWatcher): string {
  return new Date(watcher.assistidoEm).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  });
}

// A frase de quem viu e quando, na folha do episódio: "Vocês viram juntos em 12 de out.".
export function describeEpisodeWatch(status: EpisodeWatchStatus, partner: Person | null): string {
  const { me, partner: theirs } = status;
  const partnerName = partner?.shortName ?? 'Seu par';

  if (!partner) return me ? `Você viu em ${shortDate(me)}` : 'Você ainda não viu';
  if (me && theirs) {
    return me.juntos && theirs.juntos
      ? `Vocês viram juntos em ${shortDate(me)}`
      : `Você viu em ${shortDate(me)}, ${partnerName} em ${shortDate(theirs)}`;
  }
  // "Só ..." como na marca: a data abreviada já termina em ponto ("out."), então a frase
  // acaba nela.
  if (me) return `Só você viu, em ${shortDate(me)}`;
  if (theirs) return `Só ${partnerName} viu, em ${shortDate(theirs)}`;
  return 'Nenhum de vocês viu ainda';
}

// A marca dita em palavras, para o leitor de tela (o círculo é só visual).
export function markLabel(kind: EpisodeMarkKind, partner: Person | null): string {
  switch (kind) {
    case 'together':
      return 'Vocês viram juntos';
    case 'apart':
      return 'Os dois viram, cada um na sua hora';
    case 'me':
      return partner ? 'Só você viu' : 'Você viu';
    case 'partner':
      return `Só ${partner?.shortName ?? 'seu par'} viu`;
    case 'none':
      return 'Ninguém viu ainda';
  }
}

// Quantos episódios de uma temporada estão em cada marca. Ninguém viu = o que sobra do
// total, então não entra aqui.
export type SeasonMarkCounts = Record<Exclude<EpisodeMarkKind, 'none'>, number>;

export const EMPTY_SEASON_MARKS: SeasonMarkCounts = { together: 0, apart: 0, me: 0, partner: 0 };

// As marcas de todas as temporadas numa passada só: alimentam os trilhos das pílulas de
// temporada e a legenda embaixo delas.
export function countMarksBySeason(
  progress: SeriesProgress,
  meId: string,
  partnerId: string | null,
): Map<number, SeasonMarkCounts> {
  const bySeason = new Map<number, SeasonMarkCounts>();
  for (const entry of progress.episodios) {
    const kind = getEpisodeMarkKind({
      me: entry.assistidoPor.find((watcher) => watcher.usuarioId === meId) ?? null,
      partner: partnerId
        ? (entry.assistidoPor.find((watcher) => watcher.usuarioId === partnerId) ?? null)
        : null,
    });
    if (kind === 'none') continue;
    const counts = bySeason.get(entry.temporada) ?? { ...EMPTY_SEASON_MARKS };
    counts[kind]++;
    bySeason.set(entry.temporada, counts);
  }
  return bySeason;
}

// Quantos episódios da temporada cada um viu, a partir das marcas.
export function seasonWatchedBy(counts: SeasonMarkCounts) {
  return {
    me: counts.together + counts.apart + counts.me,
    partner: counts.together + counts.apart + counts.partner,
  };
}
