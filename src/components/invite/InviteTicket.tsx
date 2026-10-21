import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Popcorn } from 'lucide-react';
import { CoupleAvatars } from '@/components/couple/CoupleAvatars';
import { InviteStamp } from '@/components/invite/InviteStamp';
import { RescheduleSheet } from '@/components/invite/RescheduleSheet';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TicketPerforation } from '@/components/ui/TicketPerforation';
import { useCouple } from '@/hooks/useCouple';
import { useAnswerInvite, useCancelInvite } from '@/hooks/useInvites';
import { useNow } from '@/hooks/useNow';
import { cx } from '@/lib/cx';
import { formatTimeAgo } from '@/lib/dates';
import {
  describeCountdown,
  describeInviteTime,
  describeSession,
  getTicketState,
  type TicketState,
} from '@/lib/invites';
import type { Person } from '@/lib/people';
import { formatEpisodeCode } from '@/lib/progress';
import { tmdbBackdropUrl, tmdbPosterUrl } from '@/lib/tmdb';
import type { Invite } from '@/types/api';

interface InviteTicketProps {
  invite: Invite;
  // Chegou por um aviso: o ingresso acende por um instante.
  highlight?: boolean;
}

// O convite do "Bora?" como um ingresso de cinema: em cima, a sessão (a série, o episódio, a
// hora e a frase); depois do picote, o canhoto com quem chamou e o que dá para fazer. O
// mesmo ingresso fica no topo da lista e em "Entre vocês", para os dois: dá para responder
// por aqui mesmo que o push tenha sumido.
export function InviteTicket({ invite, highlight = false }: InviteTicketProps) {
  const titleId = useId();
  const { me, partner } = useCouple();
  const now = useNow();
  if (!me || !partner) return null;

  const state = getTicketState(invite, me.id);
  const session = describeSession(invite.at, now);
  const posterUrl = tmdbPosterUrl(invite.series.posterPath, 'w185');
  const backdropUrl = tmdbBackdropUrl(invite.series.backdropPath);

  return (
    <section
      aria-labelledby={titleId}
      className={cx('relative rounded-lg bg-surface', highlight && 'animate-spotlight')}
    >
      {/* A frente do ingresso. O corte da imagem fica aqui: os dentes do picote passam
          para fora do cartão. */}
      <div className="relative isolate overflow-hidden rounded-t-lg">
        {backdropUrl && (
          <>
            <img
              src={backdropUrl}
              alt=""
              className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35"
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-linear-to-r from-surface via-surface/90 to-surface/55"
            />
          </>
        )}

        <div className="flex flex-col gap-4 px-4 pt-4 pb-5">
          <div className="flex min-h-7 items-start justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-together uppercase">
              <Popcorn size={14} strokeWidth={2.25} aria-hidden />
              Convite pro sofá
            </p>
            <StampOnChange state={state} />
          </div>

          <div className="flex items-center gap-3.5">
            <div className="aspect-2/3 w-14 shrink-0 overflow-hidden rounded-sm bg-surface-2 ring-1 ring-line">
              {posterUrl && <img src={posterUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2
                id={titleId}
                className="line-clamp-2 text-lg leading-tight font-extrabold tracking-tight"
              >
                {invite.series.nome}
              </h2>
              {/* A frase vem num bilhetinho, como os recados da dupla. */}
              {invite.phrase && (
                <p className="mt-0.5 self-start rounded-lg rounded-bl-sm bg-note px-2.5 py-1 text-sm leading-snug font-semibold text-on-note">
                  {invite.phrase}
                </p>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-3">
            <TicketField label="Sessão" value={session.time} detail={session.day} />
            <TicketField
              label="Episódio"
              value={formatEpisodeCode({ temporada: invite.season, episodio: invite.episode })}
            />
            <TicketField label="Sala" value="Sofá" detail="2 lugares" />
          </dl>
        </div>
      </div>

      <TicketPerforation />

      <TicketStub invite={invite} state={state} me={me} partner={partner} now={now} />
    </section>
  );
}

// O carimbo só "cai" quando o estado muda com o ingresso na tela (o par topou agora); um
// ingresso que já abre confirmado mostra o carimbo parado.
function StampOnChange({ state }: { state: TicketState }) {
  const [shown, setShown] = useState(state);
  const [changed, setChanged] = useState(false);
  if (shown !== state) {
    setShown(state);
    setChanged(true);
  }
  return <InviteStamp key={state} state={state} animate={changed} />;
}

// Um campo do ingresso: o rótulo pequeno em cima e o valor embaixo.
function TicketField({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-[10px] font-bold tracking-[0.14em] text-fg-subtle uppercase">{label}</dt>
      <dd className="flex min-w-0 flex-col">
        <span className="truncate text-base leading-tight font-extrabold tracking-tight tabular-nums">
          {value}
        </span>
        {detail && <span className="truncate text-xs text-fg-muted">{detail}</span>}
      </dd>
    </div>
  );
}

interface TicketStubProps {
  invite: Invite;
  state: TicketState;
  me: Person;
  partner: Person;
  now: Date;
}

// O canhoto: quem chamou, em que pé está, e as respostas.
function TicketStub({ invite, state, me, partner, now }: TicketStubProps) {
  const answer = useAnswerInvite();
  const cancel = useCancelInvite();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTrigger, setRescheduleTrigger] = useState<HTMLElement | null>(null);

  const isPending = answer.isPending || cancel.isPending;
  const error = answer.error ?? cancel.error;
  const countdown = state === 'confirmed' ? describeCountdown(invite.at, now) : null;
  // Chegou a hora: o botão da série vira o convite para ir.
  const isNow =
    state === 'confirmed' && (invite.at === null || Date.parse(invite.at) <= now.getTime());

  return (
    <div className="flex flex-col gap-3.5 px-4 pt-4 pb-4">
      <div className="flex items-center gap-2.5">
        {state === 'invited' || state === 'waiting' ? (
          <Avatar person={partner} size="sm" />
        ) : (
          <CoupleAvatars me={me} partner={partner} size="sm" />
        )}
        <p aria-live="polite" className="min-w-0 flex-1 text-sm leading-snug text-fg-muted">
          <StubLine invite={invite} state={state} me={me} partner={partner} now={now} />
        </p>
      </div>

      {countdown && (
        <p
          className={cx(
            'inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-bold tabular-nums',
            isNow ? 'bg-together text-on-together' : 'bg-together/15 text-together',
          )}
        >
          <Clock size={13} strokeWidth={2.5} aria-hidden />
          {countdown}
        </p>
      )}

      {state === 'invited' && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => answer.mutate({ inviteId: invite.id, answer: { answer: 'accept' } })}
            isLoading={answer.isPending && answer.variables?.answer.answer === 'accept'}
            disabled={isPending}
            className="col-span-2"
          >
            Bora!
          </Button>
          <Button
            variant="secondary"
            aria-haspopup="dialog"
            disabled={isPending}
            onClick={(event) => {
              setRescheduleTrigger(event.currentTarget);
              setRescheduleOpen(true);
            }}
          >
            Outro horário
          </Button>
          <Button
            variant="ghost"
            onClick={() => answer.mutate({ inviteId: invite.id, answer: { answer: 'decline' } })}
            isLoading={answer.isPending && answer.variables?.answer.answer === 'decline'}
            disabled={isPending}
          >
            Hoje não
          </Button>
        </div>
      )}

      {state === 'waiting' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => cancel.mutate(invite.id)}
          isLoading={cancel.isPending}
          className="-ml-3 self-start"
        >
          Cancelar convite
        </Button>
      )}

      {state === 'confirmed' && (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/series/${invite.series.id}`}
            className={cx(
              'inline-flex min-h-11 flex-1 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors',
              isNow
                ? 'bg-accent text-on-accent hover:bg-accent-hover'
                : 'bg-surface-2 text-fg hover:bg-line',
            )}
          >
            {isNow ? 'Bora pro sofá' : 'Abrir a série'}
          </Link>
          <Button
            variant="ghost"
            onClick={() => cancel.mutate(invite.id)}
            isLoading={cancel.isPending}
          >
            Desistir
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error.message || 'Não deu certo. Tente de novo.'}
        </p>
      )}

      {state === 'invited' && (
        <RescheduleSheet
          invite={invite}
          open={rescheduleOpen}
          onClose={() => setRescheduleOpen(false)}
          returnFocusTo={rescheduleTrigger}
        />
      )}
    </div>
  );
}

// A frase do canhoto, sempre do ponto de vista de quem olha.
function StubLine({ invite, state, me, partner, now }: TicketStubProps) {
  const name = <strong className="font-semibold text-fg">{partner.shortName}</strong>;
  const when = describeInviteTime(invite.at, now);
  const sentAgo = formatTimeAgo(new Date(invite.createdAt), now);

  switch (state) {
    case 'invited':
      return (
        <>
          {name} te chamou · {sentAgo}
        </>
      );
    case 'waiting':
      return (
        <>
          Esperando {name} responder
          <WaitingDots />
        </>
      );
    case 'confirmed':
      if (invite.toId === me.id) {
        return invite.rescheduled ? <>Você topou, {when}</> : <>Você topou. Tá marcado!</>;
      }
      return invite.rescheduled ? (
        <>
          {name} topou, mas {when}
        </>
      ) : (
        <>{name} topou! Tá marcado.</>
      );
    case 'done':
      return <>Vocês viram juntos. Que sessão!</>;
    case 'declined':
      return invite.toId === me.id ? (
        <>Fica pra próxima.</>
      ) : (
        <>Hoje não rola pra {name}. Fica pra próxima.</>
      );
    case 'canceled':
      return <>O convite foi cancelado.</>;
    case 'expired':
      return <>O horário passou.</>;
  }
}

function WaitingDots() {
  return (
    <span aria-hidden className="ml-0.5 inline-flex gap-0.5">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="inline-block h-1 w-1 animate-wait-dot rounded-full bg-current align-middle"
          style={{ animationDelay: `${index * 160}ms` }}
        />
      ))}
    </span>
  );
}
