import type { Person } from '@/lib/people';
import type { TrackedSeries } from '@/types/api';

// "Quero ver" da dupla numa série: quem marcou. Sem par, `partner` é sempre false.
export interface CoupleInterest {
  mine: boolean;
  partner: boolean;
}

export function getCoupleInterest(
  series: TrackedSeries,
  me: Person,
  partner: Person | null,
): CoupleInterest {
  // Uma API anterior ao "quero ver" (front publicado antes dela) ainda não manda o campo.
  const ids = series.interessados ?? [];
  return {
    mine: ids.includes(me.id),
    partner: !!partner && ids.includes(partner.id),
  };
}

// Quantos de vocês querem ver: 2 é "os dois querem".
export function countInterested({ mine, partner }: CoupleInterest): number {
  return Number(mine) + Number(partner);
}
