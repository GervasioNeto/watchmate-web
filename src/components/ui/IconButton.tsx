import type { ButtonHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // Obrigatório: o botão não tem texto visível.
  'aria-label': string;
  size?: 'sm' | 'md';
}

export function IconButton({
  size = 'md',
  className,
  type = 'button',
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
