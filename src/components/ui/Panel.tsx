import { useId, type ReactNode } from 'react';

interface PanelProps {
  title: string;
  // Fica à direita do título: um resumo curto ou botões.
  aside?: ReactNode;
  children: ReactNode;
}

// Bloco de conteúdo com título, no fundo `surface`.
export function Panel({ title, aside, children }: PanelProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4 rounded-lg bg-surface p-4">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <h2 id={headingId} className="text-base font-bold tracking-tight">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
