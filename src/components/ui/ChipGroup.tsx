import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHasBeenSeen } from '@/hooks/useHasBeenSeen';
import { useRadioGroup } from '@/hooks/useRadioGroup';
import { useScrollEdges } from '@/hooks/useScrollEdges';
import { cx } from '@/lib/cx';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  // Quantos itens a opção mostraria; omitido enquanto não dá para saber.
  count?: number;
}

type ChipSize = 'sm' | 'md';

interface ChipGroupProps<T extends string> {
  label: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // `md`: filtro principal; `sm`: filtro secundário, mais discreto.
  size?: ChipSize;
  // A fileira vai até as bordas da tela, passando por baixo do respiro lateral da página
  // (px-4): as pílulas somem na borda de verdade, não 16px antes dela.
  bleed?: boolean;
  className?: string;
}

// Fileira de pílulas de seleção única que rola na horizontal quando não cabe. Quando
// alguma fica escondida, a borda daquele lado avisa (ver ScrollEdge).
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  size = 'md',
  bleed = false,
  className,
}: ChipGroupProps<T>) {
  const { groupProps, itemProps } = useRadioGroup(
    options.map((option) => option.value),
    value,
    onChange,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const edges = useScrollEdges(containerRef);
  // A setinha do fim cutuca uma vez, quando a fileira aparece na tela (não adianta cutucar
  // abaixo da dobra); depois só aparece e some.
  const hasBeenSeen = useHasBeenSeen(containerRef);
  const [hasNudged, setHasNudged] = useState(false);

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
    <div className={cx(bleed && '-mx-4', className)}>
      <div className="relative">
        {/* O respiro vertical (py-1, desfeito pelo -my-1) deixa o contorno de foco caber:
            a rolagem horizontal corta o que passa da fileira em cima e embaixo também. */}
        <div
          {...groupProps}
          ref={containerRef}
          aria-label={label}
          className={cx('-my-1 flex gap-1.5 overflow-x-auto py-1 scrollbar-none', bleed && 'px-4')}
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

        <ScrollEdge
          side="start"
          visible={edges.start}
          size={size}
          onPress={() => edges.scrollByPage(-1)}
        />
        <ScrollEdge
          side="end"
          visible={edges.end}
          size={size}
          nudge={edges.end && hasBeenSeen && !hasNudged}
          onNudgeEnd={() => setHasNudged(true)}
          onPress={() => edges.scrollByPage(1)}
        />
      </div>
    </div>
  );
}

interface ScrollEdgeProps {
  side: 'start' | 'end';
  visible: boolean;
  size: ChipSize;
  nudge?: boolean;
  onNudgeEnd?: () => void;
  onPress: () => void;
}

// A pista de que a fileira continua: a borda esmaece no fundo da página, por cima das
// pílulas que passam dela, e uma setinha leva ao que está escondido. É só para o toque e o
// mouse (fora do Tab e do leitor de tela): no teclado, as setas já andam pelas opções.
function ScrollEdge({ side, visible, size, nudge = false, onNudgeEnd, onPress }: ScrollEdgeProps) {
  const isEnd = side === 'end';
  const Icon = isEnd ? ChevronRight : ChevronLeft;

  return (
    <div
      aria-hidden
      className={cx(
        'pointer-events-none absolute inset-y-0 flex w-16 items-center from-canvas from-45% to-transparent transition-opacity duration-200',
        isEnd
          ? 'right-0 justify-end bg-linear-to-l pr-2'
          : 'left-0 justify-start bg-linear-to-r pl-2',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={onPress}
        onAnimationEnd={onNudgeEnd}
        className={cx(
          'flex items-center justify-center rounded-full bg-surface-2 text-fg shadow-md ring-1 ring-line transition-[scale,background-color] hover:bg-line active:scale-90',
          size === 'md' ? 'h-8 w-8' : 'h-7 w-7',
          visible && 'pointer-events-auto',
          nudge && 'animate-nudge',
        )}
      >
        <Icon size={size === 'md' ? 18 : 16} strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}
