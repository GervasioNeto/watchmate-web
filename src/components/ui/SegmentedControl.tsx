import { useRadioGroup } from '@/hooks/useRadioGroup';
import { cx } from '@/lib/cx';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

// Duas ou três opções que dividem a largura (ex.: Entrar / Criar conta).
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
  className,
}: SegmentedControlProps<T>) {
  const { groupProps, itemProps } = useRadioGroup(
    options.map((option) => option.value),
    value,
    onChange,
  );

  return (
    <div
      {...groupProps}
      aria-label={label}
      className={cx('flex rounded-md bg-surface-2 p-1', className)}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          {...itemProps(index)}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cx(
            'min-h-9 flex-1 rounded-sm px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
            option.value === value ? 'bg-canvas text-fg' : 'text-fg-muted hover:text-fg',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
