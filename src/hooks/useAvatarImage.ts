import { useQuery } from '@tanstack/react-query';
import { avatarQueries } from '@/api/queries';
import { DEFAULT_AVATAR_STYLE, type AvatarStyleId } from '@/lib/avatarStyles';

// Data URI do avatar do DiceBear, ou undefined enquanto o motor carrega
// (quem usa mostra a inicial nesse meio-tempo).
export function useAvatarImage(avatar: { style: AvatarStyleId; seed: string } | null) {
  const { data } = useQuery({
    ...avatarQueries.image(avatar?.style ?? DEFAULT_AVATAR_STYLE, avatar?.seed ?? ''),
    enabled: !!avatar,
  });
  return avatar ? data : undefined;
}
