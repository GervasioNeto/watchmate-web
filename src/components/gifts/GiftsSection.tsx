import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, Gift as GiftIcon, LockKeyhole } from 'lucide-react';
import { GiftBox } from '@/components/gifts/GiftBox';
import { GiftComposerSheet } from '@/components/gifts/composer/GiftComposerSheet';
import { VoucherTicket } from '@/components/gifts/VoucherTicket';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouple } from '@/hooks/useCouple';
import { requestGiftReveal } from '@/hooks/useGiftReveal';
import { useCancelGift, useGifts, useUseVoucher } from '@/hooks/useGifts';
import { useNow } from '@/hooks/useNow';
import { cx } from '@/lib/cx';
import { formatTimeAgo } from '@/lib/dates';
import { formatCountdownShort, formatOpening, occasionOf, wrapOf } from '@/lib/gifts';
import { scrollBehavior } from '@/lib/motion';
import type { Person } from '@/lib/people';
import type { Gift } from '@/types/api';

// Trancado para quem vê agora (a lista pode ter vindo da API antes de a hora chegar).
function isLocked(gift: Gift, now: Date): boolean {
  return new Date(gift.deliverAt) > now;
}

// Os presentes da dupla, na Dupla: o botão de dar um presente, os vales esperando para ser
// usados, os presentes que você recebeu (tocar revive a abertura; o trancado mostra quanto
// falta) e os que você deu, com o que aconteceu com cada um.
//
// ?gift=<id> (dos avisos): um recebido abre (na surpresa do GiftRevealHost); um dado acende na
// lista.
export function GiftsSection() {
  const { me, partner, byId } = useCouple();
  const { data, isLoading } = useGifts(!!partner);
  const redeem = useUseVoucher();
  const now = useNow(30_000);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTrigger, setComposerTrigger] = useState<HTMLElement | null>(null);
  const [justUsed, setJustUsed] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const linkedId = params.get('gift');

  // O aviso de um presente: abre o recebido de novo, ou acende o dado; e sai do endereço.
  const [handledLink, setHandledLink] = useState<string | null>(null);
  // O dado acende e fica aceso o tempo da animação, mesmo depois que o pedido sai do endereço.
  const [highlightId, setHighlightId] = useState<string | null>(null);
  if (data && linkedId && linkedId !== handledLink) {
    setHandledLink(linkedId);
    if (!data.received.some((gift) => gift.id === linkedId)) setHighlightId(linkedId);
  }
  useEffect(() => {
    if (!linkedId || !data) return;
    if (data.received.some((gift) => gift.id === linkedId)) requestGiftReveal(linkedId);
    document
      .querySelector(`[data-gift="${linkedId}"]`)
      ?.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
    setParams(
      (current) => {
        current.delete('gift');
        return current;
      },
      { replace: true, preventScrollReset: true },
    );
  }, [linkedId, data, setParams]);

  if (!me || !partner) return null;

  const received = data?.received ?? [];
  const sent = data?.sent ?? [];
  // Os vales que você ganhou e ainda não usou, de todos os presentes abertos.
  const vouchers = received.flatMap((gift) =>
    gift.openedAt ? gift.vouchers.map((voucher) => ({ gift, voucher })) : [],
  );
  const unusedFirst = [...vouchers].sort(
    (a, b) => Number(a.voucher.usedAt !== null) - Number(b.voucher.usedAt !== null),
  );

  function openComposer(trigger: HTMLElement) {
    setComposerTrigger(trigger);
    setComposerOpen(true);
  }

  return (
    <Panel
      title="Presentes"
      aside={
        <Button
          size="sm"
          variant="secondary"
          aria-haspopup="dialog"
          onClick={(event) => openComposer(event.currentTarget)}
        >
          <GiftIcon size={16} strokeWidth={2.25} aria-hidden />
          Dar um presente
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-20 rounded-md" />
      ) : received.length === 0 && sent.length === 0 ? (
        <p className="text-sm leading-relaxed text-fg-muted">
          Nenhum presente ainda. Escreva uma carta, coloque um vale e mande: a tela de{' '}
          {partner.shortName} vai explodir em corações. 💞
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {unusedFirst.length > 0 && (
            <GiftGroup title="Seus vales">
              {unusedFirst.map(({ gift, voucher }) => (
                <VoucherTicket
                  key={voucher.id}
                  voucher={voucher}
                  wrap={wrapOf(gift.wrap)}
                  justUsed={justUsed === voucher.id}
                  isUsing={redeem.isPending && redeem.variables?.voucherId === voucher.id}
                  onUse={() =>
                    redeem.mutate(
                      { giftId: gift.id, voucherId: voucher.id },
                      { onSuccess: () => setJustUsed(voucher.id) },
                    )
                  }
                />
              ))}
            </GiftGroup>
          )}
          {received.length > 0 && (
            <GiftGroup title="Que você ganhou">
              {received.map((gift) => (
                <ReceivedGiftRow
                  key={gift.id}
                  gift={gift}
                  from={byId(gift.fromId)}
                  now={now}
                  onOpen={() => requestGiftReveal(gift.id)}
                />
              ))}
            </GiftGroup>
          )}
          {sent.length > 0 && (
            <GiftGroup title="Que você deu">
              {sent.map((gift) => (
                <SentGiftRow
                  key={gift.id}
                  gift={gift}
                  partner={partner}
                  now={now}
                  highlight={highlightId === gift.id}
                />
              ))}
            </GiftGroup>
          )}
        </div>
      )}

      <GiftComposerSheet
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        returnFocusTo={composerTrigger}
      />
    </Panel>
  );
}

function GiftGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-[11px] font-bold tracking-[0.14em] text-fg-subtle uppercase">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function ReceivedGiftRow({
  gift,
  from,
  now,
  onOpen,
}: {
  gift: Gift;
  from: Person | null;
  now: Date;
  onOpen: () => void;
}) {
  const occasion = occasionOf(gift.occasion);
  const opensAt = new Date(gift.deliverAt);
  const locked = isLocked(gift, now);
  const sender = from?.shortName ?? 'seu par';
  const vouchers =
    gift.vouchers.length > 0
      ? ` · ${gift.vouchers.length} ${gift.vouchers.length === 1 ? 'vale' : 'vales'}`
      : '';
  const detail = locked
    ? `De ${sender} · abre ${formatOpening(opensAt, now)}`
    : `De ${sender} · ${formatTimeAgo(opensAt, now)}${vouchers}`;

  return (
    <button
      type="button"
      data-gift={gift.id}
      aria-haspopup="dialog"
      onClick={onOpen}
      className="group flex items-center gap-3 rounded-md bg-surface-2 p-2.5 pr-3 text-left transition-colors hover:bg-line"
    >
      <GiftBox
        wrap={wrapOf(gift.wrap)}
        lock={locked ? 'locked' : undefined}
        size={44}
        className="shrink-0"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-bold">{occasion.headline}</span>
        <span className="truncate text-xs text-fg-muted">{detail}</span>
      </span>
      {locked ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-fg/10 py-1 pr-2.5 pl-2 text-xs font-bold tabular-nums">
          <LockKeyhole size={12} strokeWidth={2.75} aria-hidden />
          <span className="sr-only">Trancado, abre em </span>
          {formatCountdownShort(opensAt.getTime() - now.getTime())}
        </span>
      ) : gift.openedAt === null ? (
        <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-on-accent">
          Abrir
        </span>
      ) : (
        <ChevronRight
          size={18}
          aria-hidden
          className="shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5"
        />
      )}
    </button>
  );
}

function SentGiftRow({
  gift,
  partner,
  now,
  highlight,
}: {
  gift: Gift;
  partner: Person;
  now: Date;
  highlight: boolean;
}) {
  const cancel = useCancelGift();
  const occasion = occasionOf(gift.occasion);
  const used = gift.vouchers.filter((voucher) => voucher.usedAt !== null);

  const locked = isLocked(gift, now);
  const status = locked
    ? `Trancado · abre ${formatOpening(new Date(gift.deliverAt), now)}`
    : !gift.openedAt
      ? `Entregue · ${partner.shortName} ainda não abriu`
      : `${partner.shortName} abriu ${formatTimeAgo(new Date(gift.openedAt), now)}`;

  return (
    <div
      data-gift={gift.id}
      className={cx(
        'flex flex-col gap-2 rounded-md bg-surface-2 p-2.5 pr-3',
        highlight && 'animate-spotlight',
      )}
    >
      <div className="flex items-center gap-3">
        <GiftBox
          wrap={wrapOf(gift.wrap)}
          lock={locked ? 'locked' : undefined}
          size={44}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-bold">{occasion.headline}</span>
          <span className="truncate text-xs text-fg-muted">
            {status}
            {gift.reaction && ` ${gift.reaction}`}
          </span>
        </div>
        {locked && (
          <Button
            variant="ghost"
            size="sm"
            isLoading={cancel.isPending}
            onClick={() => {
              const question = `Desfazer este presente? ${partner.shortName} já está vendo a caixinha trancada, e ela some.`;
              if (window.confirm(question)) cancel.mutate(gift.id);
            }}
          >
            Desfazer
          </Button>
        )}
      </div>
      {used.length > 0 && (
        <ul className="flex flex-col gap-1 pl-14">
          {used.map((voucher) => (
            <li key={voucher.id} className="text-xs text-fg-muted">
              🎟️ {partner.shortName} usou:{' '}
              <span className="font-semibold text-fg">
                {voucher.emoji} {voucher.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
