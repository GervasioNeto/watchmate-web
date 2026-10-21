import { useState } from 'react';
import { SessionTimePicker } from '@/components/invite/SessionTimePicker';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { useCouple } from '@/hooks/useCouple';
import { useActiveInvite, useSendInvite } from '@/hooks/useInvites';
import { cx } from '@/lib/cx';
import {
  describeInviteTime,
  deviceTimeZone,
  getTimeChoices,
  INVITE_PHRASES,
  isLiveInvite,
  nextFullHour,
  resolveSessionTime,
  type SessionTimeDraft,
} from '@/lib/invites';
import { formatEpisodeCode } from '@/lib/progress';

interface InviteComposerSheetProps {
  open: boolean;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
  series: { id: string; nome: string };
  season: number;
  episode: number;
}

interface Draft extends SessionTimeDraft {
  phrase: string | null;
}

// Começa no primeiro horário da noite de hoje, se ainda tem; senão, "agora".
function newDraft(now: Date): Draft {
  const choices = getTimeChoices(now);
  const tonight = choices.find((choice) => choice.value.startsWith('today-'));
  return {
    choices,
    selected: tonight?.value ?? 'now',
    custom: nextFullHour(now),
    phrase: null,
  };
}

// O "Bora?": quando, uma frase pronta se quiser, e a prévia de como chega no celular do par.
// Mandar substitui o convite que estiver valendo (o app avisa antes).
export function InviteComposerSheet({
  open,
  onClose,
  returnFocusTo,
  series,
  season,
  episode,
}: InviteComposerSheetProps) {
  const { me, partner } = useCouple();
  const send = useSendInvite();
  const { data: active } = useActiveInvite(!!partner);
  const [draft, setDraft] = useState(() => newDraft(new Date()));
  // Cada abertura começa do zero, com os horários de agora.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setDraft(newDraft(new Date()));
  }

  if (!me || !partner) return null;

  const now = new Date();
  const at = resolveSessionTime(draft, now);
  const code = formatEpisodeCode({ temporada: season, episodio: episode });
  const when = at === undefined ? null : describeInviteTime(at?.toISOString() ?? null, now);
  const replaced = isLiveInvite(active) ? active : null;

  function close() {
    send.reset();
    onClose();
  }

  function submit() {
    if (at === undefined) return;
    send.mutate(
      {
        seriesId: series.id,
        season,
        episode,
        at: at?.toISOString() ?? null,
        timeZone: deviceTimeZone(),
        phrase: draft.phrase,
      },
      { onSuccess: close },
    );
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={`Chamar ${partner.shortName} pro sofá`}
      description={`${series.nome} · ${code}`}
      returnFocusTo={returnFocusTo}
      footer={
        <div className="flex flex-col gap-2">
          {send.isError && (
            <p role="alert" className="text-sm text-danger">
              {send.error.message || 'Não deu para mandar. Tente de novo.'}
            </p>
          )}
          <Button
            onClick={submit}
            isLoading={send.isPending}
            disabled={at === undefined}
            className="w-full"
          >
            Mandar convite
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-2">
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-bold">Quando?</h3>
          <SessionTimePicker
            label="Quando"
            draft={draft}
            onChange={(time) => setDraft({ ...draft, ...time })}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-bold">
            Mandar junto <span className="font-normal text-fg-subtle">(se quiser)</span>
          </h3>
          <div role="group" aria-label="Frase do convite" className="flex flex-wrap gap-2">
            {INVITE_PHRASES.map((phrase) => {
              const selected = draft.phrase === phrase;
              return (
                <button
                  key={phrase}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setDraft({ ...draft, phrase: selected ? null : phrase })}
                  className={cx(
                    'min-h-9 rounded-full px-3.5 text-sm font-semibold transition-colors',
                    selected ? 'bg-fg text-canvas' : 'bg-surface-2 text-fg-muted hover:text-fg',
                  )}
                >
                  {phrase}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-bold">Assim chega pra {partner.shortName}</h3>
          <NotificationPreview
            title={`🍿 ${me.shortName} te chamou pro sofá${at === null ? ' agora' : ''}`}
            body={
              (at === null || !when
                ? `${series.nome} · ${code}`
                : `${series.nome} · ${when} · ${code}`) +
              (draft.phrase ? `\n“${draft.phrase}”` : '')
            }
          />
          <p className="text-xs leading-relaxed text-fg-subtle">
            Se o aviso passar batido, o convite fica esperando por {partner.shortName} em Entre
            vocês, e no topo da lista.
          </p>
          {replaced && (
            <p className="rounded-md border border-dashed border-line px-3 py-2.5 text-xs leading-relaxed text-fg-muted">
              {replaced.toId === me.id
                ? `${partner.shortName} já te chamou pra ${replaced.series.nome}. Mandar este convite troca aquele pelo seu.`
                : `Isso troca o seu convite de ${replaced.series.nome} (${describeInviteTime(replaced.at, now)}) por este.`}
            </p>
          )}
        </section>
      </div>
    </Sheet>
  );
}

// Um aviso de celular desenhado, com o ícone do app: a pessoa vê o que o par vai receber.
function NotificationPreview({ title, body }: { title: string; body: string }) {
  return (
    <div aria-hidden className="flex gap-3 rounded-lg bg-surface-2 p-3 shadow-sm">
      <img src="/icons/icon-192.png" alt="" className="h-9 w-9 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold">{title}</p>
          <span className="shrink-0 text-[11px] text-fg-subtle">agora</span>
        </div>
        <p className="text-sm leading-snug whitespace-pre-line text-fg-muted">{body}</p>
      </div>
    </div>
  );
}
