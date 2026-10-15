import { cx } from '@/lib/cx';
import { TONE_CLASSES } from '@/lib/personTone';
import type { WatchBadge as WatchBadgeData } from '@/lib/watchBadge';

// Pílula de quem viu o episódio: laranja para "juntos", neutra para "os dois" e a cor
// da pessoa quando só uma viu. O texto curto é visual; a frase completa vai para o
// leitor de tela.
export function WatchBadge({ badge }: { badge: WatchBadgeData }) {
  const toneClass =
    badge.kind === 'together'
      ? 'bg-together text-on-together'
      : badge.kind === 'both'
        ? 'bg-surface-2 text-fg-muted'
        : TONE_CLASSES[badge.person.tone].soft;

  return (
    <>
      <span
        aria-hidden
        title={badge.description}
        className={cx(
          'inline-flex h-5 max-w-32 min-w-0 items-center rounded-full px-2 text-xs font-bold',
          toneClass,
        )}
      >
        <span className="truncate">{badge.word}</span>
      </span>
      <span className="sr-only">{badge.description}</span>
    </>
  );
}
