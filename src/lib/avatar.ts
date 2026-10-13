import { Avatar, Style } from '@dicebear/core';
import { AVATAR_STYLES, type AvatarStyleId } from '@/lib/avatarStyles';

// Motor do DiceBear. Só é importado dinamicamente (useAvatarImage), para não
// pesar no carregamento inicial do app.

const styleCache = new Map<AvatarStyleId, Promise<Style>>();

function getStyle(id: AvatarStyleId): Promise<Style> {
  let style = styleCache.get(id);
  if (!style) {
    style = AVATAR_STYLES[id]
      .loadDefinition()
      .then((definition) => new Style(definition))
      .catch((error: unknown) => {
        // Falhou ao baixar (rede): esquece, para a próxima tentativa buscar de novo.
        styleCache.delete(id);
        throw error;
      });
    styleCache.set(id, style);
  }
  return style;
}

export async function renderAvatar(style: AvatarStyleId, seed: string): Promise<string> {
  return new Avatar(await getStyle(style), { seed }).toDataUri();
}
