import { isAwaitingPremiere } from '@/lib/airing';
import type { ListEntry } from '@/lib/seriesFilters';

// Sorteio com uma opção só não tem graça: abaixo disso, não há sorteio.
export const MIN_DRAW_POOL = 2;

// De onde sai o sorteio de "Para começar": todas as da fila, cada uma com a mesma chance.
// O "Quero ver" não pesa aqui (ele já ordena a fila); com ele pesando, duas marcadas pelos
// dois acabavam sendo as únicas da roleta. Série que não estreou fica de fora: não dá para
// começar hoje.
export function getDrawPool(entries: ListEntry[], now: Date): ListEntry[] {
  const available = entries.filter((entry) => !isAwaitingPremiere(entry.series, now));
  return available.length >= MIN_DRAW_POOL ? available : [];
}

export interface DrawStep {
  id: string;
  // Quanto tempo esse passo fica aceso, em ms.
  duration: number;
}

const DRAW_STEPS = 14;
const FIRST_STEP_MS = 70;
const LAST_SPIN_STEP_MS = 280;
// A sorteada fica acesa um pouco antes de abrir a série.
const WINNER_HOLD_MS = 900;

// A roleta: passa pelas opções numa ordem embaralhada, cada vez mais devagar, e para na
// sorteada. Com duas opções, alterna entre elas.
export function buildDrawSteps(ids: string[], winner: string, random = Math.random): DrawStep[] {
  const order = [...ids];
  for (let index = order.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [order[index], order[other]] = [order[other], order[index]];
  }

  // Começa no ponto que faz o último passo cair exatamente na sorteada.
  const offset = order.indexOf(winner) - (DRAW_STEPS - 1);
  return Array.from({ length: DRAW_STEPS }, (_, step) => {
    const isLast = step === DRAW_STEPS - 1;
    const progress = step / (DRAW_STEPS - 2);
    return {
      id: order[(((offset + step) % order.length) + order.length) % order.length],
      duration: isLast
        ? WINNER_HOLD_MS
        : Math.round(FIRST_STEP_MS + (LAST_SPIN_STEP_MS - FIRST_STEP_MS) * progress ** 2),
    };
  });
}
