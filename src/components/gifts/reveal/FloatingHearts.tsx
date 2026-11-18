import type { CSSProperties } from 'react';
import { HEART_PATH } from '@/lib/gifts';

// Coraçõezinhos que sobem devagar no fundo. Posições fixas (não sorteadas a cada desenho).
const FLOATERS = Array.from({ length: 16 }, (_, index) => ({
  left: (index * 37 + 7) % 100,
  size: 10 + ((index * 7) % 14),
  duration: 8 + (index % 5) * 1.7,
  delay: -index * 1.25,
  sway: (index % 2 ? 1 : -1) * (8 + (index % 4) * 6),
  opacity: 0.16 + (index % 3) * 0.1,
}));

export function FloatingHearts({ color }: { color: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {FLOATERS.map((heart, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          className="gift-float-heart absolute -bottom-8"
          style={
            {
              left: `${heart.left}%`,
              width: heart.size,
              height: heart.size,
              '--float-duration': `${heart.duration}s`,
              '--float-delay': `${heart.delay}s`,
              '--float-sway': `${heart.sway}px`,
              '--float-opacity': heart.opacity,
            } as CSSProperties
          }
        >
          <path d={HEART_PATH} fill={color} />
        </svg>
      ))}
    </div>
  );
}
