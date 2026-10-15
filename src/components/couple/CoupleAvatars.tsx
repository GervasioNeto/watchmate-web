import { UserPlus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cx } from '@/lib/cx';
import type { Person } from '@/lib/people';

type PairSize = 'sm' | 'lg' | 'xl';

// Espaço entre os dois e o lugar vazio de cada tamanho. O `lg` é o do palco de recados:
// com gap de 8px, o centro de cada avatar fica 32px para o lado do meio, que é onde os
// rabinhos dos balões apontam (ver BubbleTail).
const PAIR_STYLES: Record<PairSize, { gap: string; seat: string; icon: number }> = {
  sm: { gap: 'gap-1', seat: 'h-7 w-7', icon: 14 },
  lg: { gap: 'gap-2', seat: 'h-14 w-14', icon: 20 },
  xl: { gap: 'gap-3', seat: 'h-24 w-24', icon: 30 },
};

interface CoupleAvatarsProps {
  me: Person;
  partner: Person | null;
  size: PairSize;
}

// Os dois lado a lado, pertinho e sem se sobrepor: o seu primeiro, o do par depois.
// Sem par ainda, o lugar vazio tracejado ao lado do seu. Único lugar que desenha a dupla.
export function CoupleAvatars({ me, partner, size }: CoupleAvatarsProps) {
  const pair = PAIR_STYLES[size];
  return (
    <span aria-hidden className={cx('flex shrink-0 items-center', pair.gap)}>
      <Avatar person={me} size={size} />
      {partner ? (
        <Avatar person={partner} size={size} />
      ) : (
        <span
          className={cx(
            'flex items-center justify-center rounded-full border-2 border-dashed border-fg-subtle text-fg-subtle',
            pair.seat,
          )}
        >
          <UserPlus size={pair.icon} />
        </span>
      )}
    </span>
  );
}
