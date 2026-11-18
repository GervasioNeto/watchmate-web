import { useId } from 'react';
import { cx } from '@/lib/cx';
import { HEART_PATH, type WrapTheme } from '@/lib/gifts';

// Os coraçõezinhos estampados no papel: posição e tamanho dentro da caixa.
const PAPER_HEARTS = [
  { x: 48, y: 124, scale: 0.7 },
  { x: 128, y: 112, scale: 0.55 },
  { x: 134, y: 152, scale: 0.8 },
  { x: 54, y: 160, scale: 0.5 },
];

// O cadeado é sempre tinta escura: lê bem em qualquer papel.
const LOCK_INK = '#17151a';

export type GiftBoxState = 'still' | 'closed' | 'opening' | 'empty';

interface GiftBoxProps {
  wrap: WrapTheme;
  // `still`: parada. `closed`: balança esperando o toque. `opening`: chacoalha e a tampa voa.
  // `empty`: já sem tampa, com a luz saindo de dentro.
  state?: GiftBoxState;
  // Presente trancado: o cadeado pendurado na fita. `unlocking` abre e deixa ele cair (e
  // avisa no fim, para quem desenha tirar o cadeado).
  lock?: 'locked' | 'unlocking';
  onUnlocked?: () => void;
  size?: number;
  className?: string;
}

// A caixa de presente, desenhada: o papel com coraçõezinhos, a fita cruzando e o laço em
// cima. A tampa (com o laço) é um grupo à parte, que voa quando a caixa abre (ver gift-lid-off
// no index.css); embaixo dela já está o fundo da caixa e a luz, que aparecem quando ela sai.
export function GiftBox({
  wrap,
  state = 'still',
  lock,
  onUnlocked,
  size = 200,
  className,
}: GiftBoxProps) {
  const lightId = useId();
  const showsInside = state === 'opening' || state === 'empty';

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden
      className={cx('gift-box overflow-visible', state !== 'still' && `is-${state}`, className)}
    >
      <defs>
        <radialGradient id={lightId} cx="50%" cy="100%" r="100%">
          <stop offset="0%" stopColor={wrap.ribbon} stopOpacity="0.95" />
          <stop offset="55%" stopColor={wrap.ribbon} stopOpacity="0.25" />
          <stop offset="100%" stopColor={wrap.ribbon} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="190" rx="64" ry="7" fill="#000" opacity="0.35" />

      {/* Por dentro: a parede do fundo e a luz que sobe quando a tampa sai. */}
      {showsInside && (
        <g className="gift-inside">
          <path d="M100 96 m-78 0 a78 64 0 0 1 156 0 z" fill={`url(#${lightId})`} />
          <rect x="40" y="84" width="120" height="16" rx="4" fill={wrap.paperShade} />
          <rect x="40" y="84" width="120" height="16" rx="4" fill="#000" opacity="0.28" />
        </g>
      )}

      <g>
        <rect x="34" y="94" width="132" height="92" rx="12" fill={wrap.paper} />
        {PAPER_HEARTS.map((heart, index) => (
          <path
            key={index}
            d={HEART_PATH}
            fill={wrap.ribbon}
            opacity="0.32"
            transform={`translate(${heart.x} ${heart.y}) scale(${heart.scale})`}
          />
        ))}
        {/* A sombra que a tampa faz no corpo da caixa. */}
        <rect x="34" y="94" width="132" height="14" fill={wrap.paperShade} opacity="0.6" />
        <rect x="91" y="94" width="18" height="92" fill={wrap.ribbon} />
        <rect x="91" y="94" width="4" height="92" fill="#fff" opacity="0.35" />
      </g>

      {state !== 'empty' && (
        <g className="gift-lid">
          <rect x="26" y="68" width="148" height="32" rx="10" fill={wrap.paper} />
          <rect
            x="26"
            y="90"
            width="148"
            height="10"
            rx="4"
            fill={wrap.paperShade}
            opacity="0.45"
          />
          <rect x="91" y="68" width="18" height="32" fill={wrap.ribbon} />
          {/* O laço: duas alças, as pontas caindo e o nó. */}
          <path
            d="M100 66 C 86 36, 52 38, 60 58 C 66 72, 90 70, 100 66 Z"
            fill={wrap.ribbon}
            stroke={wrap.paperShade}
            strokeOpacity="0.25"
            strokeWidth="2"
          />
          <path
            d="M100 66 C 114 36, 148 38, 140 58 C 134 72, 110 70, 100 66 Z"
            fill={wrap.ribbon}
            stroke={wrap.paperShade}
            strokeOpacity="0.25"
            strokeWidth="2"
          />
          <path d="M97 68 L84 94 L93 92 L100 70 Z" fill={wrap.ribbon} opacity="0.9" />
          <path d="M103 68 L116 94 L107 92 L100 70 Z" fill={wrap.ribbon} opacity="0.9" />
          <circle cx="100" cy="65" r="9" fill={wrap.ribbon} />
          <circle cx="97" cy="62" r="3" fill="#fff" opacity="0.6" />
        </g>
      )}

      {lock && (
        <g
          className={cx('gift-lock', lock === 'unlocking' && 'is-unlocking')}
          onAnimationEnd={(event) => {
            if (event.animationName === 'gift-lock-drop') onUnlocked?.();
          }}
        >
          {/* A alça passa por trás da fita, como se o cadeado prendesse o laço. */}
          <path
            className="gift-lock-shackle"
            d="M89 128 V116 a11 11 0 0 1 22 0 V128"
            fill="none"
            stroke={LOCK_INK}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <rect x="80" y="122" width="40" height="34" rx="9" fill={LOCK_INK} />
          <rect x="84" y="125" width="32" height="3" rx="1.5" fill="#fff" opacity="0.14" />
          <circle cx="100" cy="137" r="4.5" fill={wrap.ribbon} />
          <rect x="98" y="138" width="4" height="9" rx="2" fill={wrap.ribbon} />
        </g>
      )}
    </svg>
  );
}
