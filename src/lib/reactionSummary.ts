import type { EpisodeReaction } from '@/types/api';

// Quanto mais alto, mais "empolgada" a reação é considerada — usado só
// pra decidir quem "gostou mais" quando as duas pessoas reagem diferente.
// É subjetivo, ajuste como quiser.
const REACTION_WEIGHTS: Record<string, number> = {
  '❤️': 3,
  '🔥': 3,
  '😂': 2,
  '😮': 1,
  '😐': 0,
  '😢': -1,
};

const SAME_REACTION_PHRASES: Record<string, string> = {
  '❤️': 'Vocês dois amaram esse episódio.',
  '🔥': 'Vocês dois amaram esse episódio.',
  '😂': 'Vocês dois acharam hilário.',
  '😮': 'Vocês dois ficaram surpresos.',
  '😐': 'Vocês dois ficaram indiferentes.',
  '😢': 'Vocês dois se emocionaram.',
};

// Compara a sua reação com a do par. Reação oculta (episódio que você ainda não viu)
// não entra na comparação.
export function getReactionSummary(
  reactions: EpisodeReaction[],
  meId: string,
  partnerName: string,
): string | null {
  const mine = reactions.find((entry) => entry.usuarioId === meId);
  const theirs = reactions.find((entry) => entry.usuarioId !== meId);

  if (!mine || !theirs || mine.oculto || theirs.oculto) return null;

  if (mine.emoji === theirs.emoji) {
    return SAME_REACTION_PHRASES[mine.emoji] ?? 'Vocês tiveram a mesma reação.';
  }

  const myWeight = REACTION_WEIGHTS[mine.emoji] ?? 0;
  const theirWeight = REACTION_WEIGHTS[theirs.emoji] ?? 0;

  if (myWeight === theirWeight) {
    return 'Reações diferentes, mas parecem ter curtido igual.';
  }

  return myWeight > theirWeight
    ? `Você gostou mais que ${partnerName}.`
    : `${partnerName} gostou mais que você.`;
}
