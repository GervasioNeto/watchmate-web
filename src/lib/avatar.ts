import { Avatar, Style, type StyleDefinition } from '@dicebear/core';
import funEmoji from '@dicebear/styles/fun-emoji.json' with { type: 'json' };

interface AvatarStyleConfig {
  label: string;
  definition: StyleDefinition;
  // Most DiceBear styles are CC BY 4.0, which requires crediting the artist.
  credit: { artist: string; license: string; url: string };
}

// Registry of the avatar styles the user can pick from. To offer a new style,
// import its definition from @dicebear/styles and add an entry here — the
// backend keeps its own allow-list (ESTILOS_AVATAR) that must match these keys.
export const AVATAR_STYLES = {
  'fun-emoji': {
    label: 'Fun Emoji',
    definition: funEmoji as StyleDefinition,
    credit: {
      artist: 'Davis Uche',
      license: 'CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/',
    },
  },
} satisfies Record<string, AvatarStyleConfig>;

export type AvatarStyleId = keyof typeof AVATAR_STYLES;

export const DEFAULT_AVATAR_STYLE: AvatarStyleId = 'fun-emoji';

export function isAvatarStyle(value: string | null | undefined): value is AvatarStyleId {
  return !!value && value in AVATAR_STYLES;
}

const styleCache = new Map<AvatarStyleId, Style>();

function getStyle(id: AvatarStyleId): Style {
  let style = styleCache.get(id);
  if (!style) {
    style = new Style(AVATAR_STYLES[id].definition);
    styleCache.set(id, style);
  }
  return style;
}

export function avatarDataUri(style: AvatarStyleId, seed: string): string {
  return new Avatar(getStyle(style), { seed }).toDataUri();
}

export function randomAvatarSeed(): string {
  return crypto.randomUUID().slice(0, 8);
}
