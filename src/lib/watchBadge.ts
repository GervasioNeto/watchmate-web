import type { Person } from '@/lib/people';
import type { EpisodeWatchStatus } from '@/lib/progress';

// O que a pílula ao lado do código do episódio mostra. `word` é o texto curto da
// pílula; `description` é a frase completa para leitor de tela e tooltip.
export type WatchBadge =
  | { kind: 'together'; word: string; description: string }
  | { kind: 'both'; word: string; description: string }
  | { kind: 'single'; person: Person; word: string; description: string };

export function getWatchBadge(
  status: EpisodeWatchStatus,
  me: Person,
  partner: Person | null,
): WatchBadge | null {
  // Sem par no grupo, o check do episódio já diz tudo.
  if (!partner) return null;

  if (status.me && status.partner) {
    return status.me.juntos && status.partner.juntos
      ? { kind: 'together', word: 'juntos', description: 'Vocês viram juntos' }
      : { kind: 'both', word: 'os dois', description: 'Os dois viram' };
  }
  if (status.me) {
    return { kind: 'single', person: me, word: 'você', description: 'Só você viu' };
  }
  if (status.partner) {
    return {
      kind: 'single',
      person: partner,
      word: partner.shortName,
      description: `Só ${partner.shortName} viu`,
    };
  }
  return null;
}
