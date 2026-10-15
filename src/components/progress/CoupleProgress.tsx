import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cx } from '@/lib/cx';
import { subjectName, type Person } from '@/lib/people';
import { formatEpisodeCode } from '@/lib/progress';
import type { EpisodePosition } from '@/types/api';

export interface CoupleProgressRow {
  person: Person;
  position: EpisodePosition | null;
  percent: number;
}

interface CoupleProgressProps {
  rows: CoupleProgressRow[];
  // Até onde os dois chegaram; ausente quando ainda não há par no grupo.
  common?: { position: EpisodePosition | null; summary: string | null };
  children?: ReactNode;
  className?: string;
}

// Só apresentação: quem já viu até onde, e o que os dois têm em comum.
export function CoupleProgress({ rows, common, children, className }: CoupleProgressProps) {
  return (
    <section
      aria-label="Progresso de vocês"
      className={cx('flex flex-col gap-4 rounded-lg bg-surface p-4', className)}
    >
      <ul className="flex flex-col gap-3.5">
        {rows.map(({ person, position, percent }) => (
          <li key={person.id} className="flex items-center gap-3">
            <Avatar person={person} size="sm" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-semibold">{subjectName(person)}</span>
                <span className="shrink-0 text-sm text-fg-muted tabular-nums">
                  {position ? formatEpisodeCode(position) : 'Não começou'}
                </span>
              </div>
              <ProgressBar
                value={percent}
                tone={person.tone}
                label={`Progresso de ${subjectName(person)}`}
              />
            </div>
          </li>
        ))}
      </ul>

      {common && (
        <div className="flex flex-col gap-0.5 border-t border-line pt-3">
          {/* Sem cor: "em comum" conta o que os dois viram, juntos ou não. O laranja é só do "juntos". */}
          <p className="text-sm font-semibold">
            {common.position
              ? `Em comum até ${formatEpisodeCode(common.position)}`
              : 'Nada em comum ainda'}
          </p>
          {common.summary && <p className="text-sm text-fg-muted">{common.summary}</p>}
        </div>
      )}

      {children}
    </section>
  );
}
