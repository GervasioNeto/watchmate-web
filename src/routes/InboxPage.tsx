import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Popcorn } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { InboxItemRow } from '@/components/inbox/InboxItemRow';
import { InviteTicket } from '@/components/invite/InviteTicket';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouple } from '@/hooks/useCouple';
import { useInbox, useMarkInboxSeen } from '@/hooks/useInbox';
import { useActiveInvite, useAnswerInvite } from '@/hooks/useInvites';
import { useNow } from '@/hooks/useNow';
import { groupInboxByDay } from '@/lib/inbox';
import { scrollBehavior } from '@/lib/motion';

// "Entre vocês": tudo o que o par fez para você nos últimos 30 dias, guardado pela API. O
// push é só a cópia que avisa: apagou o aviso do celular, ele continua aqui. O convite que
// está valendo fica fixo no topo, como ingresso, para ser respondido daqui.
//
// Endereços que os avisos abrem (ver messages.ts no watchmate-api):
// - ?invite=<id>: acende aquele convite;
// - &answer=accept|decline: o botão do push ("Bora!", "Hoje não"), feito ao abrir.
export function InboxPage() {
  const { me, partner, byId } = useCouple();
  const [params, setParams] = useSearchParams();
  const highlightId = params.get('invite');
  const answerParam = params.get('answer');
  const inbox = useInbox();
  const active = useActiveInvite(!!partner);
  const { mutate: answerInvite } = useAnswerInvite();
  const { mutate: markSeen } = useMarkInboxSeen();
  const now = useNow(60_000);

  // Abriu a tela, ou chegou algo novo com ela aberta: o que está aqui deixa de ser novo (e
  // os avisos do WatchMate saem da bandeja do celular).
  const newestAt = inbox.data?.[0]?.at ?? null;
  const isLoaded = inbox.isSuccess;
  useEffect(() => {
    if (isLoaded) markSeen();
  }, [isLoaded, newestAt, markSeen]);

  // O botão do push: responde uma vez, assim que o convite chega, e tira o pedido do
  // endereço (voltar ou recarregar não responde de novo).
  const handledAnswer = useRef(false);
  useEffect(() => {
    if (!answerParam || handledAnswer.current || !active.isSuccess || !me) return;
    handledAnswer.current = true;
    const invite = active.data;
    if (
      invite &&
      invite.id === highlightId &&
      invite.status === 'pending' &&
      invite.toId === me.id &&
      (answerParam === 'accept' || answerParam === 'decline')
    ) {
      answerInvite({ inviteId: invite.id, answer: { answer: answerParam } });
    }
    setParams(
      (current) => {
        current.delete('answer');
        return current;
      },
      { replace: true, preventScrollReset: true },
    );
  }, [answerParam, active.isSuccess, active.data, highlightId, me, answerInvite, setParams]);

  // O convite do aviso que está no histórico (não no topo): rola até ele.
  useEffect(() => {
    if (!highlightId || !isLoaded) return;
    document
      .querySelector('[data-highlight="true"]')
      ?.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
  }, [highlightId, isLoaded]);

  const pinned = active.data ?? null;
  // O que está no ingresso do topo não se repete embaixo; volta para o histórico quando
  // o convite deixa de valer.
  const items = (inbox.data ?? []).filter((item) => !pinned || item.invite?.id !== pinned.id);
  const days = groupInboxByDay(items, now);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-canvas">
        <div className="mx-auto flex max-w-xl items-center gap-2 px-2 py-2.5">
          <BackButton />
          <div className="flex min-w-0 flex-col">
            <h1 className="text-lg leading-tight font-bold">Entre vocês</h1>
            <p className="truncate text-xs text-fg-subtle">
              {partner
                ? `O que ${partner.shortName} fez pra você nos últimos 30 dias`
                : 'Os avisos da dupla'}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-8 px-4 pt-5 pb-16">
        {pinned && <InviteTicket invite={pinned} highlight={pinned.id === highlightId} />}

        {inbox.isLoading ? (
          <div aria-label="Carregando os avisos" className="flex flex-col gap-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2 pt-1">
                  <Skeleton className="h-3.5 w-4/5 rounded-sm" />
                  <Skeleton className="h-3 w-1/4 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : inbox.isError ? (
          <div className="flex flex-col items-start gap-3 rounded-lg bg-surface p-4">
            <p className="text-sm text-fg-muted">Não foi possível carregar os avisos.</p>
            <Button variant="secondary" size="sm" onClick={() => inbox.refetch()}>
              Tentar de novo
            </Button>
          </div>
        ) : days.length > 0 ? (
          <>
            {days.map((day) => (
              <section key={day.key} aria-labelledby={`inbox-${day.key}`}>
                <h2
                  id={`inbox-${day.key}`}
                  className="mb-1 text-[11px] font-bold tracking-[0.14em] text-fg-subtle uppercase"
                >
                  {day.title}
                </h2>
                <ul className="flex flex-col gap-1">
                  {day.items.map((item) => (
                    <InboxItemRow
                      key={item.id}
                      item={item}
                      actor={byId(item.actorId)}
                      now={now}
                      highlight={!!highlightId && item.invite?.id === highlightId}
                    />
                  ))}
                </ul>
              </section>
            ))}
            <p className="text-center text-xs text-fg-subtle">Os avisos ficam aqui por 30 dias.</p>
          </>
        ) : (
          !pinned && <EmptyInbox partnerName={partner?.shortName ?? null} />
        )}
      </main>
    </>
  );
}

function EmptyInbox({ partnerName }: { partnerName: string | null }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-together/15 text-together">
        <Popcorn size={26} strokeWidth={2} aria-hidden />
      </span>
      <p className="text-base font-bold">Nada por aqui ainda</p>
      <p className="max-w-72 text-sm leading-relaxed text-balance text-fg-muted">
        {partnerName
          ? `Quando ${partnerName} comentar, reagir ou te chamar pro sofá, aparece aqui. Mesmo se o aviso do celular sumir.`
          : 'Quando seu par entrar no grupo, os avisos de vocês aparecem aqui.'}
      </p>
    </div>
  );
}
