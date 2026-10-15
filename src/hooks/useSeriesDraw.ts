import { useEffect, useRef, useState } from 'react';
import { buildDrawSteps } from '@/lib/seriesDraw';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Roda a roleta do sorteio: `highlightedId` é o card aceso a cada passo e `winnerId` a
// sorteada, quando ela para. No fim chama `onDone` (que abre a série). Com movimento
// reduzido, não há roleta: vai direto para a sorteada.
export function useSeriesDraw() {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  // Saiu da página no meio do sorteio: nada de abrir uma série depois.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function start(ids: string[], onDone: (winnerId: string) => void) {
    if (ids.length === 0 || timers.current.length > 0) return;
    const winner = ids[Math.floor(Math.random() * ids.length)];
    if (prefersReducedMotion()) {
      onDone(winner);
      return;
    }

    const steps = buildDrawSteps(ids, winner);
    let at = 0;
    steps.forEach((step, index) => {
      const isLast = index === steps.length - 1;
      timers.current.push(
        window.setTimeout(() => {
          setHighlightedId(step.id);
          if (isLast) setWinnerId(step.id);
        }, at),
      );
      at += step.duration;
    });
    timers.current.push(
      window.setTimeout(() => {
        // Esvazia a mesma lista (sem trocar por outra): a limpeza do efeito guarda ela.
        timers.current.length = 0;
        setHighlightedId(null);
        setWinnerId(null);
        onDone(winner);
      }, at),
    );
  }

  return { highlightedId, winnerId, isDrawing: highlightedId !== null, start };
}
