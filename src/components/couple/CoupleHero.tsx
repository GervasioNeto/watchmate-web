import { UserPlus } from 'lucide-react';
import { InviteCode } from '@/components/InviteCode';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { pluralEpisodes } from '@/lib/coupleSummary';
import type { CoupleStats } from '@/lib/coupleStats';
import { cx } from '@/lib/cx';
import { formatMonth } from '@/lib/dates';
import type { Person } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';

interface CoupleHeroProps {
  me: Person;
  partner: Person | null;
  groupName: string | null;
  // Data de criação do grupo: "juntos desde".
  since: Date | null;
  // Só enquanto o par não entrou.
  inviteCode: string | null;
  // null enquanto o progresso das séries carrega.
  stats: CoupleStats | null;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

interface ScoreProps {
  value: number | null;
  label: string;
  dotClass: string;
  emphasis?: boolean;
}

function Score({ value, label, dotClass, emphasis }: ScoreProps) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-center">
      {value === null ? (
        <Skeleton className="h-9 w-10 rounded-sm" />
      ) : (
        <span
          className={cx(
            'leading-none font-extrabold tracking-tight tabular-nums',
            emphasis ? 'text-4xl' : 'text-3xl',
          )}
        >
          {value}
        </span>
      )}
      <span className="flex items-center gap-1.5 text-xs text-fg-muted">
        <span aria-hidden className={cx('h-1.5 w-1.5 shrink-0 rounded-full', dotClass)} />
        {label}
      </span>
    </div>
  );
}

// O topo da página da dupla: os dois avatares, quem são e o placar desde o começo.
// Sem par ainda, o lugar vazio e o código para convidar.
export function CoupleHero({ me, partner, groupName, since, inviteCode, stats }: CoupleHeroProps) {
  return (
    <section
      aria-label={partner ? 'A dupla' : 'Você'}
      className="flex flex-col items-center gap-5 rounded-lg bg-surface px-5 pt-7 pb-5 text-center"
    >
      <div className="flex items-center">
        <Avatar person={me} size="xl" className="ring-4 ring-surface" />
        {partner ? (
          <Avatar person={partner} size="xl" className="-ml-6 ring-4 ring-surface" />
        ) : (
          // Lugar de quem ainda não entrou: opaco, para não deixar o anel sobre o seu avatar.
          <span
            aria-hidden
            className="-ml-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-fg-subtle bg-surface-2 text-fg-subtle ring-4 ring-surface"
          >
            <UserPlus size={30} />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl leading-tight font-extrabold tracking-tight text-balance">
          {partner ? `${me.shortName} & ${partner.shortName}` : me.name}
        </h1>
        {partner ? (
          <>
            {groupName && <p className="text-sm text-fg-muted">{groupName}</p>}
            {since && <p className="text-xs text-fg-subtle">juntos desde {formatMonth(since)}</p>}
          </>
        ) : (
          <p className="text-sm text-fg-muted">Seu par ainda não entrou no grupo.</p>
        )}
      </div>

      {partner ? (
        <div className="flex w-full flex-col gap-4 border-t border-line pt-5">
          <div className="grid grid-cols-3 items-end gap-2">
            <Score
              value={stats?.mine ?? null}
              label="você viu"
              dotClass={TONE_CLASSES[me.tone].solid}
            />
            <Score value={stats?.together ?? null} label="juntos" dotClass="bg-together" emphasis />
            <Score
              value={stats?.partners ?? null}
              label={`${partner.shortName} viu`}
              dotClass={TONE_CLASSES[partner.tone].solid}
            />
          </div>
          <p className="text-xs text-fg-subtle">
            {stats
              ? [
                  `Episódios em ${plural(stats.seriesCount, 'série', 'séries')}`,
                  stats.finishedTogether > 0
                    ? plural(stats.finishedTogether, 'terminada juntos', 'terminadas juntos')
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : 'Somando o progresso de todas as séries…'}
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-2 border-t border-line pt-5">
          {inviteCode && (
            <>
              <p className="text-sm text-fg-muted">Mande este código para a pessoa entrar:</p>
              <InviteCode code={inviteCode} />
            </>
          )}
          {stats && stats.mine > 0 && (
            <p className="text-xs text-fg-subtle">
              Você já viu {pluralEpisodes(stats.mine)} em{' '}
              {plural(stats.seriesCount, 'série', 'séries')}.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
