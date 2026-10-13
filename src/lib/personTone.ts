// Cor de cada pessoa da dupla. É fixa por pessoa (não por quem está olhando):
// os dois celulares mostram a mesma pessoa na mesma cor. Ver `buildCouple`.
export type PersonTone = 'one' | 'two';

interface ToneClasses {
  // Preenchimento cheio: barras de progresso, check "eu vi", pontos.
  solid: string;
  // Borda: check parcial (só essa pessoa viu).
  border: string;
  // Anel: seleção (reação escolhida, avatar escolhido).
  ring: string;
  // Fundo suave + texto: avatar com inicial e pílulas.
  soft: string;
}

// Único lugar que conhece as cores de pessoa. As classes ficam escritas por extenso
// para o Tailwind encontrá-las.
export const TONE_CLASSES: Record<PersonTone, ToneClasses> = {
  one: {
    solid: 'bg-person-1',
    border: 'border-person-1',
    ring: 'ring-person-1',
    soft: 'bg-person-1-soft text-on-person-1-soft',
  },
  two: {
    solid: 'bg-person-2',
    border: 'border-person-2',
    ring: 'ring-person-2',
    soft: 'bg-person-2-soft text-on-person-2-soft',
  },
};
