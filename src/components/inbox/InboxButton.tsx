import { Link } from 'react-router-dom';
import { Popcorn } from 'lucide-react';
import { useCouple } from '@/hooks/useCouple';
import { useInboxUnseen } from '@/hooks/useInbox';

// O balde de pipoca do cabeçalho leva a "Entre vocês". O número laranja conta o que chegou
// desde a última vez que você abriu (a mesma contagem do número no ícone do app).
export function InboxButton() {
  const { me } = useCouple();
  const { data: unseen = 0 } = useInboxUnseen(!!me);

  const label =
    unseen > 0
      ? `Entre vocês: ${unseen} ${unseen === 1 ? 'novidade' : 'novidades'}`
      : 'Entre vocês';

  return (
    <Link
      to="/inbox"
      aria-label={label}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      <Popcorn size={22} strokeWidth={1.9} aria-hidden />
      {unseen > 0 && (
        <span
          aria-hidden
          className="absolute top-1 right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] leading-none font-extrabold text-on-accent tabular-nums ring-2 ring-canvas"
        >
          {unseen > 9 ? '9+' : unseen}
        </span>
      )}
    </Link>
  );
}
