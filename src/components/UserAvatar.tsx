import { useMemo } from 'react';
import { avatarDataUri, isAvatarStyle } from '@/lib/avatar';

interface UserAvatarProps {
  user:
    | {
        nome: string | null;
        email?: string | null;
        avatarEstilo?: string | null;
        avatarSemente?: string | null;
      }
    | null
    | undefined;
  // Background used by the initials fallback.
  tone?: 'me' | 'partner';
  fallback?: string;
  className?: string;
}

// Rounded square like DiceBear's own previews. A percentage radius keeps the
// same proportion from the 16px badges up to the profile header.
export const AVATAR_SHAPE = 'rounded-[22%]';

const TONE_CLASSES = {
  me: 'bg-ultramarine',
  partner: 'bg-fuchsia',
};

// Renders the user's DiceBear avatar, or their initial when they haven't
// picked one yet. Size and text size come from `className` (e.g. "h-9 w-9 text-sm").
export function UserAvatar({ user, tone = 'me', fallback = '?', className = '' }: UserAvatarProps) {
  const style = user?.avatarEstilo;
  const seed = user?.avatarSemente;

  const src = useMemo(
    () => (isAvatarStyle(style) && seed ? avatarDataUri(style, seed) : null),
    [style, seed],
  );

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`shrink-0 bg-surface-raised object-cover ${AVATAR_SHAPE} ${className}`}
      />
    );
  }

  const letter = (user?.nome || user?.email || fallback)[0]?.toUpperCase() ?? fallback;

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-heading font-semibold text-white ${AVATAR_SHAPE} ${TONE_CLASSES[tone]} ${className}`}
    >
      {letter}
    </div>
  );
}
