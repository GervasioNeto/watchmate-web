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

export function getReactionSummary(reactions: EpisodeReaction[], meId: string): string | null {
  const mine = reactions.find((entry) => entry.usuario.id === meId);
  const theirs = reactions.find((entry) => entry.usuario.id !== meId);

  if (!mine || !theirs) return null;

  if (mine.emoji === theirs.emoji) {
    const phrase = SAME_REACTION_PHRASES[mine.emoji] ?? 'Vocês tiveram a mesma reação.';
    return `${mine.emoji} ${phrase}`;
  }

  const partnerName = theirs.usuario.nome ?? 'seu par';
  const myWeight = REACTION_WEIGHTS[mine.emoji] ?? 0;
  const theirWeight = REACTION_WEIGHTS[theirs.emoji] ?? 0;

  if (myWeight === theirWeight) {
    return `👀 Reações diferentes, mas parecem ter curtido igual.`;
  }

  return myWeight > theirWeight
    ? `👀 Você gostou mais que ${partnerName}.`
    : `👀 ${partnerName} gostou mais que você.`;
}
