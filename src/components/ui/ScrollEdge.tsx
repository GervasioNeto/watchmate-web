import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/lib/cx';

export type ScrollEdgeArrow = 'sm' | 'md' | 'lg';
export type ScrollEdgeFade = 'sm' | 'md' | 'lg';

// O círculo da setinha e o ícone dentro dele.
const ARROW_SIZES: Record<ScrollEdgeArrow, { button: string; icon: number }> = {
  sm: { button: 'h-7 w-7', icon: 16 },
  md: { button: 'h-8 w-8', icon: 18 },
  lg: { button: 'h-10 w-10', icon: 20 },
};

// A largura da sombra: o esmaecido que cobre o que passa da borda. Independe da setinha; se
// ficar mais estreita que ela, a setinha só passa um pouco por cima da sombra.
const FADE_WIDTHS: Record<ScrollEdgeFade, string> = {
  sm: 'w-10',
  md: 'w-12',
  lg: 'w-16',
};

interface ScrollEdgeProps {
  side: 'start' | 'end';
  visible: boolean;
  arrow: ScrollEdgeArrow;
  fade?: ScrollEdgeFade;
  nudge?: boolean;
  onNudgeEnd?: () => void;
  onPress: () => void;
}

// A pista de que uma fileira que rola para o lado continua: a borda esmaece no fundo da
// página, por cima do que passa dela, e uma setinha leva ao que está escondido (ver
// useScrollEdges). Vai dentro de um contêiner `relative` em volta da fileira. É só para o
// toque e o mouse (fora do Tab e do leitor de tela): no teclado, o foco já rola a fileira.
export function ScrollEdge({
  side,
  visible,
  arrow,
  fade = 'md',
  nudge = false,
  onNudgeEnd,
  onPress,
}: ScrollEdgeProps) {
  const isEnd = side === 'end';
  const Icon = isEnd ? ChevronRight : ChevronLeft;
  const arrowSize = ARROW_SIZES[arrow];

  return (
    <div
      aria-hidden
      className={cx(
        'pointer-events-none absolute inset-y-0 flex items-center from-canvas from-45% to-transparent transition-opacity duration-200',
        FADE_WIDTHS[fade],
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
          // shrink-0: com a sombra mais estreita que o botão, o círculo não vira oval.
          'flex shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg shadow-md ring-1 ring-line transition-[scale,background-color] hover:bg-line active:scale-90',
          arrowSize.button,
          visible && 'pointer-events-auto',
          nudge && 'animate-nudge',
        )}
      >
        <Icon size={arrowSize.icon} strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}
