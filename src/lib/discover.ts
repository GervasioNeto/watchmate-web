import { isOngoing } from '@/lib/seriesStatus';

// Textos da tela de busca e da prévia de uma série.

// "2021", "2021–2023" ou, ainda no ar, "Desde 2024".
export function airYears(
  first: number | null,
  last: number | null,
  status: string | null,
): string | null {
  if (!first) return null;
  if (isOngoing(status)) return `Desde ${first}`;
  return last && last !== first ? `${first}–${last}` : String(first);
}

export function pluralSeasons(count: number): string {
  return `${count} ${count === 1 ? 'temporada' : 'temporadas'}`;
}

// De onde saíram as sugestões "Para vocês dois": "A partir de Arcane, The Boys e mais 3".
export function basedOnLabel(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return `A partir de ${names[0]}`;
  if (names.length === 2) return `A partir de ${names[0]} e ${names[1]}`;
  return `A partir de ${names[0]}, ${names[1]} e mais ${names.length - 2}`;
}
