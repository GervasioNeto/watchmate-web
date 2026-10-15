import { cx } from '@/lib/cx';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  // O nome do switch para o leitor de tela, quando não há um texto visível ligado a ele.
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  // Enquanto a mudança é salva: o switch já mostra o novo estado, mas não aceita outro toque.
  isBusy?: boolean;
  disabled?: boolean;
}

// Liga e desliga. É um botão com role="switch": Espaço e Enter alternam, e o leitor de
// tela anuncia "ligado" ou "desligado".
export function Switch({ checked, onChange, isBusy = false, disabled, ...aria }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-busy={isBusy || undefined}
      disabled={disabled}
      onClick={() => {
        if (!isBusy) onChange(!checked);
      }}
      className={cx(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-accent' : 'bg-line',
        isBusy && 'cursor-progress',
      )}
      {...aria}
    >
      <span
        aria-hidden
        className={cx(
          'h-6 w-6 rounded-full bg-fg shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}
