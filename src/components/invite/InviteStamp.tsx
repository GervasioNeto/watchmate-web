import { cx } from '@/lib/cx';
import type { TicketState } from '@/lib/invites';

const STAMPS: Partial<Record<TicketState, { label: string; together: boolean }>> = {
  confirmed: { label: 'Confirmado', together: true },
  done: { label: 'Sessão cumprida', together: true },
  declined: { label: 'Hoje não', together: false },
  canceled: { label: 'Cancelado', together: false },
  expired: { label: 'Expirou', together: false },
};

interface InviteStampProps {
  state: TicketState;
  // O estado acabou de mudar com o ingresso na tela: o carimbo "cai" (ver stamp-in).
  animate?: boolean;
  size?: 'md' | 'sm';
  className?: string;
}

// O carimbo do ingresso: torto, com a borda dupla de carimbo de borracha. Laranja quando a
// sessão é dos dois (confirmada, cumprida); cinza quando não vai rolar.
export function InviteStamp({ state, animate = false, size = 'md', className }: InviteStampProps) {
  const stamp = STAMPS[state];
  if (!stamp) return null;

  return (
    <span
      className={cx(
        // A segunda linha é o contorno puxado para dentro (outline-offset negativo): sobra um
        // vão entre as duas, seja qual for o fundo.
        'inline-flex shrink-0 -rotate-6 items-center rounded-sm border-2 border-current font-black tracking-[0.14em] whitespace-nowrap uppercase outline-1 outline-current',
        size === 'md'
          ? 'px-2.5 py-1 text-[11px] -outline-offset-4'
          : 'px-1.5 py-0.5 text-[9px] -outline-offset-3',
        stamp.together ? 'text-together' : 'text-fg-subtle',
        animate && 'animate-stamp-in',
        className,
      )}
    >
      {stamp.label}
    </span>
  );
}
