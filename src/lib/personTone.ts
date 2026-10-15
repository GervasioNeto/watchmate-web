// Cor de cada pessoa da dupla. Cada um escolhe a sua nesta paleta (no perfil) e o app
// garante que os dois nunca tenham a mesma. É fixa por pessoa, não por quem está olhando:
// os dois celulares mostram a mesma pessoa na mesma cor (ver `buildCouple`). O "juntos"
// não é cor de pessoa: é o laranja do WatchMate (bg-together).
//
// A ordem é a do seletor, um degradê de matiz. Cada id precisa existir em três lugares:
// aqui, nos tokens `tone-*` do index.css (e nas listas @source inline de lá) e na
// paleta da API (watchmate-api, src/lib/personColors.ts), que valida a escolha.
export const PERSON_COLORS = [
  { id: 'raspberry', name: 'framboesa' },
  { id: 'bubblegum', name: 'chiclete' },
  { id: 'cotton', name: 'algodão-doce' },
  { id: 'magenta', name: 'magenta' },
  { id: 'lilac', name: 'lilás' },
  { id: 'violet', name: 'roxo' },
  { id: 'indigo', name: 'anil' },
  { id: 'blue', name: 'azul' },
  { id: 'sky', name: 'céu' },
  { id: 'turquoise', name: 'turquesa' },
  { id: 'mint', name: 'menta' },
  { id: 'green', name: 'verde' },
  { id: 'lime', name: 'lima' },
  { id: 'lemon', name: 'limão' },
  { id: 'amber', name: 'âmbar' },
] as const;

export type PersonTone = (typeof PERSON_COLORS)[number]['id'];

export const PERSON_TONES: readonly PersonTone[] = PERSON_COLORS.map((color) => color.id);

// As cores com que cada um começa, pela ordem de entrada no grupo: roxo para quem cria,
// âmbar para quem entra depois. A API usa a mesma ordem.
export const DEFAULT_TONES: readonly PersonTone[] = ['violet', 'amber'];

export function isPersonTone(value: unknown): value is PersonTone {
  return typeof value === 'string' && (PERSON_TONES as readonly string[]).includes(value);
}

// Como a cor é chamada nos textos ("Sua cor na dupla: roxo").
export function toneName(tone: PersonTone): string {
  return PERSON_COLORS.find((color) => color.id === tone)?.name ?? tone;
}

interface ToneClasses {
  // Preenchimento cheio: barras de progresso, check "eu vi", pontos.
  solid: string;
  // Borda: check parcial (só essa pessoa viu).
  border: string;
  // Anel: seleção (reação escolhida, avatar escolhido) e o avatar do perfil.
  ring: string;
  // Fundo suave + texto: avatar com inicial e pílulas.
  soft: string;
  // Texto e ícone na cor da pessoa: o coração do "quero ver".
  text: string;
}

// Único lugar que conhece as classes de cor de pessoa. Elas são montadas a partir do id,
// então o Tailwind as gera pelas listas @source inline do index.css (não lendo este arquivo).
export const TONE_CLASSES = Object.fromEntries(
  PERSON_TONES.map((tone) => [
    tone,
    {
      solid: `bg-tone-${tone}`,
      border: `border-tone-${tone}`,
      ring: `ring-tone-${tone}`,
      soft: `bg-tone-${tone}-soft text-on-tone-${tone}-soft`,
      text: `text-tone-${tone}`,
    },
  ]),
) as Record<PersonTone, ToneClasses>;
