import type { CSSProperties } from 'react';
import { GiftBox } from '@/components/gifts/GiftBox';
import { useRadioGroup } from '@/hooks/useRadioGroup';
import { cx } from '@/lib/cx';
import { WRAPS, wrapOf, type WrapTheme } from '@/lib/gifts';
import type { GiftWrap } from '@/types/api';

// A amostra de cada papel: a cor dele com a fita cruzando, como um presente visto de cima.
function swatch(wrap: WrapTheme): CSSProperties {
  const band = `transparent 41%, ${wrap.ribbon} 41% 59%, transparent 59%`;
  return {
    background: `linear-gradient(90deg, ${band}), linear-gradient(0deg, ${band}), ${wrap.paper}`,
  };
}

// O que já vai dentro da caixa, numa linha.
function describeContents(hasLetter: boolean, voucherCount: number): string {
  const vouchers = voucherCount === 1 ? 'um vale' : `${voucherCount} vales`;
  if (!hasLetter) {
    return voucherCount > 0 ? `Dentro: ${vouchers}. Falta a carta.` : 'Vazia. Comece pela carta.';
  }
  return voucherCount > 0 ? `Dentro: a carta e ${vouchers}` : 'Dentro: a carta';
}

interface WrapStageProps {
  value: GiftWrap;
  onChange: (wrap: GiftWrap) => void;
  hasLetter: boolean;
  voucherCount: number;
}

// O topo da folha: a caixa sendo montada, no brilho da cor dela, com o que já vai dentro e os
// papéis para embrulhar. Trocar o papel troca a caixa na hora (e a cor do resto da folha).
export function WrapStage({ value, onChange, hasLetter, voucherCount }: WrapStageProps) {
  const { groupProps, itemProps } = useRadioGroup(
    WRAPS.map((wrap) => wrap.key),
    value,
    onChange,
  );

  return (
    <div className="relative overflow-hidden rounded-lg bg-surface-2 px-4 pt-5 pb-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,var(--gift-glow),transparent_70%)]"
      />
      <div className="relative flex flex-col items-center gap-3">
        <GiftBox key={value} wrap={wrapOf(value)} size={124} className="block animate-wrap-in" />
        <p className="text-xs font-semibold text-fg-muted">
          {describeContents(hasLetter, voucherCount)}
        </p>
        <div {...groupProps} aria-label="Embrulho" className="mt-1 flex gap-5">
          {WRAPS.map((wrap, index) => {
            const selected = wrap.key === value;
            return (
              <button
                key={wrap.key}
                {...itemProps(index)}
                type="button"
                onClick={() => onChange(wrap.key)}
                className="group flex flex-col items-center gap-1.5 rounded-md focus-visible:outline-offset-4"
              >
                <span
                  aria-hidden
                  style={swatch(wrap)}
                  className={cx(
                    'block h-10 w-10 rounded-full ring-2 ring-offset-[3px] ring-offset-surface-2 transition-[box-shadow,scale] duration-200',
                    selected ? 'scale-110 ring-fg' : 'ring-transparent group-hover:ring-line',
                  )}
                />
                <span
                  className={cx(
                    'text-[11px] font-semibold transition-colors',
                    selected ? 'text-fg' : 'text-fg-muted',
                  )}
                >
                  {wrap.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
