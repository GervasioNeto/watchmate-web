import type { ReactNode } from 'react';

const EYEBROW = 'text-[11px] font-bold tracking-[0.14em] text-fg-subtle uppercase';

interface ComposerSectionProps {
  label: string;
  // O campo que o título nomeia (vira um <label> de verdade).
  labelFor?: string;
  // Ao lado do título, mais leve ("se quiser").
  hint?: string;
  children: ReactNode;
}

// Uma parte da folha de montar o presente, com o título pequeno em caixa alta (o mesmo das
// listas de presentes na Dupla).
export function ComposerSection({ label, labelFor, hint, children }: ComposerSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        {labelFor ? (
          <label htmlFor={labelFor} className={EYEBROW}>
            {label}
          </label>
        ) : (
          <h3 className={EYEBROW}>{label}</h3>
        )}
        {hint && <span className="text-xs text-fg-subtle">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
