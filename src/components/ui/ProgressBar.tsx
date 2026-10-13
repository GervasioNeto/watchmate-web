import { cx } from '@/lib/cx';
import { TONE_CLASSES, type PersonTone } from '@/lib/personTone';

// Tom de uma pessoa da dupla, ou um dos tons de interface.
type Tone = PersonTone | 'together' | 'accent';

function fillClass(tone: Tone): string {
  if (tone === 'together') return 'bg-together';
  if (tone === 'accent') return 'bg-accent';
  return TONE_CLASSES[tone].solid;
}

interface ProgressBarProps {
  // 0 a 100.
  value: number;
  tone: Tone;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({ value, tone, label, size = 'md', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cx(
        'overflow-hidden rounded-full bg-surface-2',
        size === 'sm' ? 'h-1' : 'h-1.5',
        className,
      )}
    >
      <div
        className={cx('h-full rounded-full transition-[width] duration-300', fillClass(tone))}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
