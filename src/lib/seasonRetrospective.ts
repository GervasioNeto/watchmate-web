import type { EpisodeReaction } from '@/types/api';

export interface SharedReactionMoment {
  emoji: string;
  count: number;
  phrase: string;
}

const SHARED_PHRASES: Record<string, (count: number) => string> = {
  '❤️': (n) => `Vocês se amaram juntos em ${n} episódio${n > 1 ? 's' : ''}`,
  '🔥': (n) => `Pegaram fogo juntos em ${n} episódio${n > 1 ? 's' : ''}`,
  '😂': (n) => `Riram juntos em ${n} episódio${n > 1 ? 's' : ''}`,
  '😮': (n) => `Se surpreenderam juntos em ${n} episódio${n > 1 ? 's' : ''}`,
  '😐': (n) => `Ficaram indiferentes juntos em ${n} episódio${n > 1 ? 's' : ''}`,
  '😢': (n) => `Se emocionaram juntos em ${n} episódio${n > 1 ? 's' : ''}`,
};

function defaultPhrase(emoji: string, count: number): string {
  return `Reagiram com ${emoji} juntos em ${count} episódio${count > 1 ? 's' : ''}`;
}

// Agrupa as reações por episódio, compara as duas pessoas e conta quantas
// vezes reagiram com o mesmo emoji — sem comparar quem "gostou mais", só
// os momentos em que sentiram a mesma coisa juntos. Reações ocultas ficam de fora.
export function getSharedReactionMoments(
  reactions: EpisodeReaction[],
  meId: string,
): SharedReactionMoment[] {
  const byEpisode = new Map<number, EpisodeReaction[]>();
  for (const reaction of reactions) {
    const list = byEpisode.get(reaction.episodio) ?? [];
    list.push(reaction);
    byEpisode.set(reaction.episodio, list);
  }

  const counts = new Map<string, number>();
  for (const entries of byEpisode.values()) {
    const mine = entries.find((entry) => entry.usuarioId === meId);
    const theirs = entries.find((entry) => entry.usuarioId !== meId);
    if (mine && theirs && !mine.oculto && !theirs.oculto && mine.emoji === theirs.emoji) {
      counts.set(mine.emoji, (counts.get(mine.emoji) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([emoji, count]) => ({
      emoji,
      count,
      phrase: (SHARED_PHRASES[emoji] ?? ((n: number) => defaultPhrase(emoji, n)))(count),
    }))
    .sort((a, b) => b.count - a.count);
}
