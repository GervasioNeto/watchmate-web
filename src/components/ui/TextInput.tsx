import type { InputHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  // `code`: códigos de convite, em fonte mono e caixa alta.
  variant?: 'default' | 'code';
}

export function TextInput({ variant = 'default', className, ...rest }: TextInputProps) {
  return (
    <input
      className={cx(
        'min-h-11 min-w-0 rounded-md border border-line bg-surface-2 px-3 text-fg placeholder:text-fg-subtle',
        // 16px no celular evita o zoom automático do iOS ao focar.
        variant === 'code'
          ? 'font-mono text-lg tracking-[0.2em] uppercase'
          : 'text-base sm:text-sm',
        className,
      )}
      {...rest}
    />
  );
}
