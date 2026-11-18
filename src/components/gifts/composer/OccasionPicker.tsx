import { useRadioGroup } from '@/hooks/useRadioGroup';
import { cx } from '@/lib/cx';
import { OCCASIONS } from '@/lib/gifts';
import type { GiftOccasion } from '@/types/api';

interface OccasionPickerProps {
  value: GiftOccasion;
  onChange: (occasion: GiftOccasion) => void;
}

// As três ocasiões lado a lado, com o emoji grande: cabem todas, sem rolar. A escolhida ganha
// a cor do embrulho (--gift-paper, da folha).
export function OccasionPicker({ value, onChange }: OccasionPickerProps) {
  const { groupProps, itemProps } = useRadioGroup(
    OCCASIONS.map((occasion) => occasion.key),
    value,
    onChange,
  );

  return (
    <div {...groupProps} aria-label="Ocasião" className="grid grid-cols-3 gap-2">
      {OCCASIONS.map((occasion, index) => {
        const selected = occasion.key === value;
        return (
          <button
            key={occasion.key}
            {...itemProps(index)}
            type="button"
            onClick={() => onChange(occasion.key)}
            className={cx(
              'flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-lg px-2 py-3 text-center text-xs leading-tight font-semibold transition-[background-color,box-shadow,color] duration-200',
              selected
                ? 'bg-[color-mix(in_oklab,var(--gift-paper)_16%,var(--color-surface-2))] text-fg shadow-[inset_0_0_0_2px_var(--gift-paper)]'
                : 'bg-surface-2 text-fg-muted hover:text-fg',
            )}
          >
            <span
              aria-hidden
              className={cx(
                'text-[1.6rem] leading-none transition-transform duration-200',
                selected && 'scale-110',
              )}
            >
              {occasion.emoji}
            </span>
            {occasion.label}
          </button>
        );
      })}
    </div>
  );
}
