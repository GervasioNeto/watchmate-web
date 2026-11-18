import { Stamp } from '@/components/ui/Stamp';
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
  // O estado acabou de mudar com o ingresso na tela: o carimbo "cai".
  animate?: boolean;
  size?: 'md' | 'sm';
  className?: string;
}

// O carimbo do ingresso do "Bora?": laranja quando a sessão é dos dois (confirmada,
// cumprida); cinza quando não vai rolar. Sem carimbo enquanto espera resposta.
export function InviteStamp({ state, animate = false, size = 'md', className }: InviteStampProps) {
  const stamp = STAMPS[state];
  if (!stamp) return null;
  return (
    <Stamp
      label={stamp.label}
      tone={stamp.together ? 'together' : 'muted'}
      animate={animate}
      size={size}
      className={className}
    />
  );
}
