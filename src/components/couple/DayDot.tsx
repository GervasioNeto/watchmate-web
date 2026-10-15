import type { ReactNode } from 'react';
import { dayKind, type DayActivity } from '@/lib/coupleActivity';
import { cx } from '@/lib/cx';
import type { Person } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';

interface DayDotProps {
  day: DayActivity;
  me: Person;
  partner: Person | null;
  // Tamanho e texto: quem usa decide (conta da semana, dia do mês, pontinho do card).
  className: string;
  // Como fica um dia sem nenhum episódio.
  emptyClassName: string;
  children?: ReactNode;
}

// Um dia pintado com as cores da dupla: laranja quando viram juntos, metade de cada cor
// quando cada um viu na sua hora, a cor de quem viu quando foi só uma pessoa.
// Único lugar que traduz um dia em cor; a semana, o mês e o card usam este componente.
export function DayDot({ day, me, partner, className, emptyClassName, children }: DayDotProps) {
  const kind = dayKind(day);
  const base = cx(
    'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
    className,
  );

  if (kind === 'empty') {
    return (
      <span aria-hidden className={cx(base, emptyClassName)}>
        {children}
      </span>
    );
  }

  if (kind === 'together') {
    return (
      <span aria-hidden className={cx(base, 'bg-together text-on-together')}>
        {children}
      </span>
    );
  }

  if (kind === 'split' && partner) {
    return (
      <span aria-hidden className={cx(base, 'text-canvas')}>
        <span className={cx('absolute inset-y-0 left-0 w-1/2', TONE_CLASSES[me.tone].solid)} />
        <span
          className={cx('absolute inset-y-0 right-0 w-1/2', TONE_CLASSES[partner.tone].solid)}
        />
        {children !== undefined && <span className="relative">{children}</span>}
      </span>
    );
  }

  const who = kind === 'partner' && partner ? partner : me;
  return (
    <span aria-hidden className={cx(base, 'text-canvas', TONE_CLASSES[who.tone].solid)}>
      {children}
    </span>
  );
}
