import type { MemberProgress } from '@/types/api';

export function pluralEpisodes(count: number): string {
  return `${count} episódio${count === 1 ? '' : 's'}`;
}

// Frase curta sobre a distância entre vocês. Evita tom de cobrança ("atrasado").
export function describeCoupleGap(
  me: MemberProgress | null,
  partner: MemberProgress | null,
  partnerName: string,
): string | null {
  if (!me || !partner) return null;
  if (me.assistidos === 0 && partner.assistidos === 0) return 'Ninguém começou ainda.';

  const mine = me.aFrente;
  const theirs = partner.aFrente;
  if (mine === 0 && theirs === 0) return 'Vocês estão no mesmo ponto.';
  if (theirs === 0) return `Você está ${pluralEpisodes(mine)} à frente.`;
  if (mine === 0) return `${partnerName} está ${pluralEpisodes(theirs)} à frente.`;
  return `Cada um viu episódios que o outro não viu: você ${mine}, ${partnerName} ${theirs}.`;
}
