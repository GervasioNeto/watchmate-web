import { UserPlus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cx } from '@/lib/cx';
import type { Person } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';

type PairSize = 'sm' | 'lg' | 'xl';

interface PairStyle {
  gap: string;
  // O anel na cor de cada um. É sombra (não ocupa espaço), então o `gap` já conta com ele:
  // sobra o mesmo respiro entre os dois anéis em todo tamanho.
  ring: string;
  seat: string;
  icon: number;
}

// O `lg` é o do palco de recados: com 12px entre os dois, o centro de cada avatar fica 34px
// para o lado do meio, que é onde os rabinhos dos balões apontam (ver CoupleStage e
// BubbleTail). O `xl` usa o mesmo anel do avatar do perfil. O `sm` (listas) fica sem anel:
// num avatar de 28px ele viraria só uma borda pesada.
const PAIR_STYLES: Record<PairSize, PairStyle> = {
  sm: { gap: 'gap-1', ring: '', seat: 'h-7 w-7', icon: 14 },
  lg: {
    gap: 'gap-3',
    ring: 'ring-2 ring-offset-2 ring-offset-surface',
    seat: 'h-14 w-14',
    icon: 20,
  },
  xl: {
    gap: 'gap-6',
    ring: 'ring-4 ring-offset-4 ring-offset-surface',
    seat: 'h-24 w-24',
    icon: 30,
  },
};

interface CoupleAvatarsProps {
  me: Person;
  partner: Person | null;
  size: PairSize;
}

// Os dois lado a lado, pertinho e sem se sobrepor: o seu primeiro, o do par depois, cada
// um com o anel na sua cor (nos tamanhos maiores). Sem par ainda, o lugar vazio tracejado
// ao lado do seu. Único lugar que desenha a dupla.
export function CoupleAvatars({ me, partner, size }: CoupleAvatarsProps) {
  const pair = PAIR_STYLES[size];
  const ringFor = (person: Person) => pair.ring && cx(pair.ring, TONE_CLASSES[person.tone].ring);

  return (
    <span aria-hidden className={cx('flex shrink-0 items-center', pair.gap)}>
      <Avatar person={me} size={size} className={ringFor(me)} />
      {partner ? (
        <Avatar person={partner} size={size} className={ringFor(partner)} />
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
