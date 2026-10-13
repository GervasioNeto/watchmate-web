import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/cx';

// Mostra 3 linhas e oferece "Ler mais" só quando o texto foi realmente cortado.
export function Synopsis({ text }: { text: string }) {
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const element = paragraphRef.current;
    if (!element || expanded) return;
    // O ResizeObserver dispara logo ao observar e de novo quando a largura muda.
    const observer = new ResizeObserver(() => {
      setIsClamped(element.scrollHeight > element.clientHeight + 1);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, text]);

  return (
    <div>
      <p
        ref={paragraphRef}
        className={cx('text-sm leading-relaxed text-fg-muted', !expanded && 'line-clamp-3')}
      >
        {text}
      </p>
      {(isClamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-1 text-sm font-semibold text-fg"
        >
          {expanded ? 'Mostrar menos' : 'Ler mais'}
        </button>
      )}
    </div>
  );
}
