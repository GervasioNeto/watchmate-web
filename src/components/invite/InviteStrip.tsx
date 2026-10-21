import { useState, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Popcorn } from 'lucide-react';
import { InviteComposerSheet } from '@/components/invite/InviteComposerSheet';
import { useCouple } from '@/hooks/useCouple';
import { useActiveInvite } from '@/hooks/useInvites';
import { useNow } from '@/hooks/useNow';
import { cx } from '@/lib/cx';
import { describeCountdown, describeInviteTime, getTicketState, isLiveInvite } from '@/lib/invites';
import { formatEpisodeCode } from '@/lib/progress';
import type { EpisodePosition, TrackedSeries } from '@/types/api';

interface InviteStripProps {
  series: TrackedSeries;
  // O episódio do convite: o mesmo do "Assistimos juntos" logo acima.
  next: EpisodePosition;
}

// O "Bora?" na página da série, logo abaixo do "Assistimos juntos": um canhoto tracejado que
// chama o par para ver o próximo. Com um convite valendo para esta série, mostra em que pé
// ele está (e leva ao ingresso para responder).
export function InviteStrip({ series, next }: InviteStripProps) {
  const { me, partner } = useCouple();
  const { data: active } = useActiveInvite(!!partner);
  const now = useNow();
  const [composerOpen, setComposerOpen] = useState(false);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);

  if (!me || !partner) return null;

  const invite = isLiveInvite(active) && active.series.id === series.id ? active : null;

  if (invite) {
    const state = getTicketState(invite, me.id);
    const when = describeInviteTime(invite.at, now);
    const content =
      state === 'invited'
        ? { title: `${partner.shortName} te chamou · ${when}`, detail: 'Toque para responder' }
        : state === 'waiting'
          ? { title: `Convite enviado · ${when}`, detail: `Esperando ${partner.shortName}` }
          : {
              title: `Sessão marcada · ${when}`,
              detail: describeCountdown(invite.at, now) ?? 'Vocês dois confirmaram',
            };
    return (
      <StripShell as="link" to={`/inbox?invite=${invite.id}`} highlighted={state === 'confirmed'}>
        <StripText title={content.title} detail={content.detail} />
      </StripShell>
    );
  }

  return (
    <>
      <StripShell
        as="button"
        onClick={(event) => {
          setTrigger(event.currentTarget);
          setComposerOpen(true);
        }}
      >
        <StripText
          title="Bora?"
          detail={`Chame ${partner.shortName} pra ver o ${formatEpisodeCode(next)} juntos`}
        />
      </StripShell>
      <InviteComposerSheet
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        returnFocusTo={trigger}
        series={series}
        season={next.temporada}
        episode={next.episodio}
      />
    </>
  );
}

const SHELL =
  'group flex w-full items-center gap-3 rounded-md border border-dashed px-3 py-2.5 text-left transition-colors';

type StripShellProps = { children: ReactNode; highlighted?: boolean } & (
  | { as: 'link'; to: string }
  | { as: 'button'; onClick: (event: MouseEvent<HTMLButtonElement>) => void }
);

// O canhoto: o balde de pipoca no círculo laranja, o texto e a setinha.
function StripShell(props: StripShellProps) {
  const className = cx(
    SHELL,
    props.highlighted
      ? 'border-together/60 bg-together/10 hover:bg-together/15'
      : 'border-line hover:border-fg-subtle',
  );
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-together/15 text-together">
        <Popcorn size={18} strokeWidth={2.25} aria-hidden />
      </span>
      {props.children}
      <ChevronRight
        size={18}
        aria-hidden
        className="shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
      />
    </>
  );

  return props.as === 'link' ? (
    <Link to={props.to} className={className}>
      {inner}
    </Link>
  ) : (
    <button type="button" aria-haspopup="dialog" onClick={props.onClick} className={className}>
      {inner}
    </button>
  );
}

function StripText({ title, detail }: { title: string; detail: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-sm font-bold">{title}</span>
      <span className="truncate text-xs text-fg-muted">{detail}</span>
    </span>
  );
}
