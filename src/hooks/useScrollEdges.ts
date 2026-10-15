import { useCallback, useEffect, useState, type RefObject } from 'react';
import { scrollBehavior } from '@/lib/motion';

interface ScrollEdges {
  // Há conteúdo escondido antes (à esquerda) e depois (à direita).
  start: boolean;
  end: boolean;
}

// Se uma fileira que rola na horizontal ainda esconde algo de cada lado. Atualiza ao rolar,
// quando a fileira muda de largura e quando os itens mudam (as contagens dos filtros chegam
// depois, e o filtro "à frente" aparece e some).
export function useScrollEdges(ref: RefObject<HTMLElement | null>) {
  const [edges, setEdges] = useState<ScrollEdges>({ start: false, end: false });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 1px de folga: com zoom, a rolagem para em frações de pixel antes do fim.
    const update = () => {
      const max = element.scrollWidth - element.clientWidth;
      const start = element.scrollLeft > 1;
      const end = element.scrollLeft < max - 1;
      setEdges((current) =>
        current.start === start && current.end === end ? current : { start, end },
      );
    };

    const resize = new ResizeObserver(update);
    const observeItems = () => {
      resize.observe(element);
      Array.from(element.children).forEach((item) => resize.observe(item));
    };
    const items = new MutationObserver(() => {
      observeItems();
      update();
    });

    observeItems();
    items.observe(element, { childList: true });
    element.addEventListener('scroll', update, { passive: true });
    update();

    return () => {
      element.removeEventListener('scroll', update);
      resize.disconnect();
      items.disconnect();
    };
  }, [ref]);

  // Avança (1) ou volta (-1) quase uma largura, deixando um pedaço do que já estava à vista
  // para a pessoa não perder o fio.
  const scrollByPage = useCallback(
    (direction: 1 | -1) => {
      const element = ref.current;
      if (!element) return;
      element.scrollBy({ left: direction * element.clientWidth * 0.7, behavior: scrollBehavior() });
    },
    [ref],
  );

  return { ...edges, scrollByPage };
}
