import { cx } from '@/lib/cx';
import type { EpisodeMarkKind } from '@/lib/episodeMark';
import type { Person } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';

// Quem viu um episódio, desenhado com a regra de cor do calendário da dupla (ver DayDot):
// laranja se viram juntos, metade de cada cor se cada um viu na sua hora, a cor de quem viu
// se foi só um. Só visual: o estado em palavras vai para o leitor de tela por quem usa
// (markLabel).
interface MarkProps {
  kind: EpisodeMarkKind;
  me: Person;
  partner: Person | null;
}

// Os pedaços de cor de uma marca: um só (juntos ou um de vocês) ou as duas metades.
function markFills({ kind, me, partner }: MarkProps): string[] {
  if (kind === 'together') return ['bg-together'];
  if (kind === 'apart' && partner) {
    return [TONE_CLASSES[me.tone].solid, TONE_CLASSES[partner.tone].solid];
  }
  if (kind === 'me') return [TONE_CLASSES[me.tone].solid];
  if (kind === 'partner' && partner) return [TONE_CLASSES[partner.tone].solid];
  return [];
}

// A barra de "visto" dos apps de streaming, na base da imagem do episódio (o pai é
// `relative`). Ninguém viu: sem barra.
export function WatchBar({ className, ...mark }: MarkProps & { className?: string }) {
  const fills = markFills(mark);
  if (fills.length === 0) return null;
  return (
    <span aria-hidden className={cx('absolute inset-x-0 bottom-0 flex h-1', className)}>
      {fills.map((fill) => (
        <span key={fill} className={cx('flex-1', fill)} />
      ))}
    </span>
  );
}

// A mesma marca numa bolinha, para legendas e frases. Ninguém viu: só o contorno.
export function MarkDot({ className, ...mark }: MarkProps & { className?: string }) {
  const fills = markFills(mark);
  return (
    <span
      aria-hidden
      className={cx(
        'flex h-2 w-2 shrink-0 overflow-hidden rounded-full',
        fills.length === 0 && 'ring-1 ring-fg-subtle ring-inset',
        className,
      )}
    >
      {fills.map((fill) => (
        <span key={fill} className={cx('flex-1', fill)} />
      ))}
    </span>
  );
}
