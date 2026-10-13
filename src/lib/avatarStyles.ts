import type { StyleDefinition } from '@dicebear/core';

// Módulo leve: só a lista de estilos, sem o DiceBear. O motor que desenha os
// avatares fica em lib/avatar.ts e é carregado sob demanda (ver useAvatarImage).

interface AvatarStyleConfig {
  label: string;
  // Most DiceBear styles are CC BY 4.0, which requires crediting the artist.
  credit: { artist: string; license: string; url: string };
  loadDefinition: () => Promise<StyleDefinition>;
}

// Registry of the avatar styles the user can pick from. To offer a new style,
// add an entry that imports its definition from @dicebear/styles — the backend
// keeps its own allow-list (ESTILOS_AVATAR) that must match these keys.
export const AVATAR_STYLES = {
  'fun-emoji': {
    label: 'Fun Emoji',
    credit: {
      artist: 'Davis Uche',
      license: 'CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/',
    },
    // Sem `with { type: 'json' }`: o Vite entrega o JSON como módulo JS, e o
    // navegador recusa um import dinâmico com esse atributo.
    loadDefinition: () =>
      import('@dicebear/styles/fun-emoji.json').then((module) => module.default as StyleDefinition),
  },
} satisfies Record<string, AvatarStyleConfig>;

export type AvatarStyleId = keyof typeof AVATAR_STYLES;

export const DEFAULT_AVATAR_STYLE: AvatarStyleId = 'fun-emoji';

export function isAvatarStyle(value: string | null | undefined): value is AvatarStyleId {
  return !!value && Object.hasOwn(AVATAR_STYLES, value);
}

export function randomAvatarSeed(): string {
  return crypto.randomUUID().slice(0, 8);
}
