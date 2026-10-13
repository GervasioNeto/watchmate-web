import { cx } from '@/lib/cx';

// Placeholder de carregamento. Tamanho e cantos vêm do `className` (ex.: "h-3 w-24 rounded-sm").
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('animate-pulse bg-surface-2', className)} />;
}
