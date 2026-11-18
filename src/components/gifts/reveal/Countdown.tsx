import { describeCountdown, splitCountdown } from '@/lib/gifts';

const pad = (value: number) => String(value).padStart(2, '0');

// Quanto falta para o presente abrir, como placar: dias (só se tiver), horas, minutos e
// segundos. Para o leitor de tela é uma frase só, que muda de minuto em minuto (os segundos
// ficam só na tela, para não falar sem parar).
export function Countdown({ ms }: { ms: number }) {
  const { days, hours, minutes, seconds } = splitCountdown(ms);
  const cells = [
    ...(days > 0 ? [{ value: String(days), unit: days === 1 ? 'dia' : 'dias' }] : []),
    { value: pad(hours), unit: 'h' },
    { value: pad(minutes), unit: 'min' },
    { value: pad(seconds), unit: 's' },
  ];

  return (
    <div role="timer" aria-label={`Abre em ${describeCountdown(ms)}`} className="flex">
      <div
        aria-hidden
        className="flex divide-x divide-fg/10 rounded-lg bg-fg/[0.06] py-2.5 ring-1 ring-fg/10 ring-inset"
      >
        {cells.map((cell) => (
          <span key={cell.unit} className="flex min-w-16 flex-col items-center gap-1 px-3">
            <span className="font-mono text-[1.75rem] leading-none font-bold tabular-nums">
              {cell.value}
            </span>
            <span className="text-[10px] font-bold tracking-[0.16em] text-fg-subtle uppercase">
              {cell.unit}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
