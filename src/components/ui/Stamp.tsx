import { cx } from '@/lib/cx';

interface StampProps {
  label: string;
  // `together`: o laranja do que é dos dois (sessão confirmada); `muted`: o que não vale mais;
  // `ink`: tinta escura, para carimbar em cima do papel claro (o vale usado).
  tone?: 'together' | 'muted' | 'ink';
  // Acabou de acontecer com a tela aberta: o carimbo "cai" (ver stamp-in).
  animate?: boolean;
  size?: 'md' | 'sm';
  className?: string;
}

// O carimbo de borracha do app (no ingresso do "Bora?" e no vale do presente): torto, com a
// borda dupla. A segunda linha é o contorno puxado para dentro (outline-offset negativo):
// sobra um vão entre as duas, seja qual for o fundo.
export function Stamp({
  label,
  tone = 'together',
  animate = false,
  size = 'md',
  className,
}: StampProps) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 -rotate-6 items-center rounded-sm border-2 border-current font-black tracking-[0.14em] whitespace-nowrap uppercase outline-1 outline-current',
        size === 'md'
          ? 'px-2.5 py-1 text-[11px] -outline-offset-4'
          : 'px-1.5 py-0.5 text-[9px] -outline-offset-3',
        tone === 'together' ? 'text-together' : tone === 'ink' ? 'text-on-note' : 'text-fg-subtle',
        animate && 'animate-stamp-in',
        className,
      )}
    >
      {label}
    </span>
  );
}
