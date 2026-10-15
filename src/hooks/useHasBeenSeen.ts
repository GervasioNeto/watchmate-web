import { useEffect, useState, type RefObject } from 'react';

// A faixa de baixo da tela que a barra de destinos cobre no celular (TabBar): o que está ali
// atrás ainda não foi visto.
const TAB_BAR_ALLOWANCE = '-72px';
// "Inteiro", com folga para as frações de pixel do layout.
const SEEN_RATIO = 0.95;

// Se o elemento já apareceu inteiro na tela pelo menos uma vez. Fica true para sempre depois
// disso: serve para animações que chamam a atenção uma vez só, quando a pessoa pode vê-las.
export function useHasBeenSeen(ref: RefObject<HTMLElement | null>) {
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasBeenSeen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Não `isIntersecting`: ele já é true com qualquer pedacinho à vista.
        if (entry.intersectionRatio >= SEEN_RATIO) setHasBeenSeen(true);
      },
      { threshold: SEEN_RATIO, rootMargin: `0px 0px ${TAB_BAR_ALLOWANCE} 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, hasBeenSeen]);

  return hasBeenSeen;
}
