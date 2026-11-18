import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { HEART_PATH, type WrapTheme } from '@/lib/gifts';

interface LetterPaperProps extends HTMLAttributes<HTMLDivElement> {
  wrap: WrapTheme;
  // Para quem é, no alto ("Pra Leila,").
  salutation: string;
  // Quem assina embaixo ("— Gervásio").
  signature: string;
  // O que vai à esquerda da assinatura (na hora de escrever, o contador de letras).
  footnote?: ReactNode;
  children: ReactNode;
}

// O papel da carta, com o selo de coração na cor do embrulho. É o mesmo na hora de escrever
// (a folha de montar) e na de ler (a abertura): quem escreve já vê a carta que vai chegar.
export function LetterPaper({
  wrap,
  salutation,
  signature,
  footnote,
  children,
  className,
  ...props
}: LetterPaperProps) {
  return (
    <div
      {...props}
      className={cx(
        'relative mt-5 w-full rounded-lg bg-note px-5 pt-9 pb-4 text-left text-on-note shadow-lg',
        className,
      )}
    >
      <span
        aria-hidden
        style={{ background: wrap.paper }}
        className="absolute -top-5 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full shadow-md ring-4 ring-note transition-colors duration-300"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path d={HEART_PATH} fill={wrap.ribbon} />
        </svg>
      </span>
      <p className="mb-1.5 text-sm font-bold text-on-note/55">{salutation}</p>
      {children}
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-xs text-on-note/55 tabular-nums">{footnote}</span>
        <span className="text-sm font-bold">— {signature}</span>
      </div>
    </div>
  );
}
