import { useEffect, useRef } from 'react';
import { useRadioGroup } from '@/hooks/useRadioGroup';
import { cx } from '@/lib/cx';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  // Quantos itens a opção mostraria; omitido enquanto não dá para saber.
  count?: number;
}

interface ChipGroupProps<T extends string> {
  label: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // `md`: filtro principal; `sm`: filtro secundário, mais discreto.
  size?: 'sm' | 'md';
  className?: string;
}

// Fileira de pílulas de seleção única que rola na horizontal quando não cabe.
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  size = 'md',
  className,
}: ChipGroupProps<T>) {
  const { groupProps, itemProps } = useRadioGroup(
    options.map((option) => option.value),
    value,
    onChange,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // A opção marcada nunca fica escondida fora da área visível (ex.: ao abrir um link
  // já filtrado). Rola só a fileira, sem mexer na rolagem da página.
  useEffect(() => {
    const container = containerRef.current;
    const selected = container?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!container || !selected) return;
    const start = selected.offsetLeft;
    const end = start + selected.offsetWidth;
    const padding = parseFloat(getComputedStyle(container).paddingLeft) || 0;
    if (start - padding < container.scrollLeft) {
      container.scrollLeft = start - padding;
    } else if (end + padding > container.scrollLeft + container.clientWidth) {
      container.scrollLeft = end + padding - container.clientWidth;
    }
  }, [value]);

  return (
    <div
      {...groupProps}
      ref={containerRef}
      aria-label={label}
      className={cx('relative flex gap-1.5 overflow-x-auto [scrollbar-width:none]', className)}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            {...itemProps(index)}
            type="button"
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors',
              size === 'md' ? 'min-h-9 px-3.5 text-sm' : 'min-h-8 px-3 text-xs',
              selected
                ? size === 'md'
                  ? 'bg-fg text-canvas'
                  : 'bg-surface-2 text-fg ring-1 ring-line'
                : size === 'md'
                  ? 'bg-surface-2 text-fg-muted hover:text-fg'
                  : 'text-fg-subtle hover:text-fg',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cx('tabular-nums', selected ? 'opacity-70' : 'opacity-80')}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
