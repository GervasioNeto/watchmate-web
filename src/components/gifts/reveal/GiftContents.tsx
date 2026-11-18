import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { LetterPaper } from '@/components/gifts/LetterPaper';
import {
  lastEmergeOrder,
  ORDER_FIRST_VOUCHER,
  ORDER_HEADLINE,
  ORDER_LETTER,
  ORDER_VOUCHERS_TITLE,
} from '@/components/gifts/reveal/choreography';
import { VoucherTicket } from '@/components/gifts/VoucherTicket';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useCouple } from '@/hooks/useCouple';
import { useReactToGift, useUseVoucher } from '@/hooks/useGifts';
import { cx } from '@/lib/cx';
import { GIFT_REACTIONS, occasionOf, type WrapTheme } from '@/lib/gifts';
import type { Person } from '@/lib/people';
import type { Gift } from '@/types/api';

// Os vales saem girando para lados alternados, como ingressos puxados da caixa.
const TICKET_TILT = ['9deg', '-8deg', '7deg'];

const order = (value: number, tilt?: string) =>
  ({ '--reveal-order': value, ...(tilt && { '--emerge-rot': tilt }) }) as CSSProperties;

interface GiftContentsProps {
  titleId: string;
  gift: Gift;
  from: Person | null;
  wrap: WrapTheme;
  // Onde a caixa estava na tela: a carta e os vales saem de lá.
  origin: DOMRect | null;
  onClose: () => void;
  previewFor?: string;
}

// O que tinha dentro. A carta e os vales saem voando de dentro da caixa (cada um parte do
// centro dela, pequeno e girado, e pousa no seu lugar); o título, as reações e o botão sobem
// devagar em volta. A medida de onde cada coisa vai pousar acontece antes de a tela pintar:
// nada pisca no lugar final antes de sair da caixa.
export function GiftContents({
  titleId,
  gift,
  from,
  wrap,
  origin,
  onClose,
  previewFor,
}: GiftContentsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { byId } = useCouple();
  const react = useReactToGift();
  const redeem = useUseVoucher();
  const [justUsed, setJustUsed] = useState<string | null>(null);
  // Na prévia, a reação e os vales usados ficam só aqui.
  const [previewReaction, setPreviewReaction] = useState<string | null>(null);
  const [previewUsed, setPreviewUsed] = useState<ReadonlySet<string>>(() => new Set());
  const reaction = previewFor ? previewReaction : gift.reaction;
  const vouchers = previewFor
    ? gift.vouchers.map((voucher) =>
        previewUsed.has(voucher.id) ? { ...voucher, usedAt: gift.createdAt } : voucher,
      )
    : gift.vouchers;
  const occasion = occasionOf(gift.occasion);
  const name = from?.shortName ?? 'Seu par';
  const recipient = byId(gift.toId)?.shortName ?? 'você';
  const afterContents = lastEmergeOrder(vouchers.length) + 1;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (origin) {
      const fromX = origin.left + origin.width / 2;
      const fromY = origin.top + origin.height * 0.55;
      for (const item of root.querySelectorAll<HTMLElement>('[data-emerge]')) {
        const rect = item.getBoundingClientRect();
        item.style.setProperty(
          '--emerge-x',
          `${Math.round(fromX - (rect.left + rect.width / 2))}px`,
        );
        item.style.setProperty(
          '--emerge-y',
          `${Math.round(fromY - (rect.top + rect.height / 2))}px`,
        );
      }
    }
    root.dataset.stage = 'emerging';
    root.querySelector<HTMLElement>('[data-reveal-focus]')?.focus({ preventScroll: true });
    // A caixa só muda de lugar numa abertura nova, que monta isto de novo: na prática, mede uma
    // vez só, e reagir ou usar um vale depois não faz nada sair da caixa outra vez.
  }, [origin]);

  return (
    <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div
        ref={rootRef}
        data-stage="measuring"
        className="gift-contents mx-auto flex max-w-sm flex-col items-center gap-6 pt-2 pb-4 text-center"
      >
        <div data-reveal style={order(ORDER_HEADLINE)} className="flex flex-col items-center gap-2">
          <p className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
            <Avatar person={from} size="xs" />
            Um presente de {name}
          </p>
          <h2
            id={titleId}
            tabIndex={-1}
            data-reveal-focus
            className="bg-linear-to-b from-fg to-(--gift-ribbon) bg-clip-text text-[2.15rem] leading-[1.05] font-extrabold tracking-tight text-balance text-transparent focus:outline-none"
          >
            {occasion.headline}
          </h2>
        </div>

        <LetterPaper
          wrap={wrap}
          salutation={`Pra ${recipient},`}
          signature={name}
          data-emerge
          style={order(ORDER_LETTER, '-6deg')}
        >
          <p className="text-[17px] leading-relaxed font-medium whitespace-pre-line wrap-break-word">
            {gift.message}
          </p>
        </LetterPaper>

        {vouchers.length > 0 && (
          <section aria-label="Vales" className="flex w-full flex-col gap-3">
            <h3 data-reveal style={order(ORDER_VOUCHERS_TITLE)} className="text-sm font-bold">
              {vouchers.length === 1 ? 'E ainda tem um vale' : 'E ainda tem vales'} 🎟️
            </h3>
            {vouchers.map((voucher, index) => (
              <div
                key={voucher.id}
                data-emerge
                style={order(ORDER_FIRST_VOUCHER + index, TICKET_TILT[index % TICKET_TILT.length])}
              >
                <VoucherTicket
                  voucher={voucher}
                  wrap={wrap}
                  justUsed={justUsed === voucher.id}
                  isUsing={redeem.isPending && redeem.variables?.voucherId === voucher.id}
                  onUse={() => {
                    if (previewFor) {
                      setPreviewUsed((current) => new Set(current).add(voucher.id));
                      setJustUsed(voucher.id);
                      return;
                    }
                    redeem.mutate(
                      { giftId: gift.id, voucherId: voucher.id },
                      { onSuccess: () => setJustUsed(voucher.id) },
                    );
                  }}
                />
              </div>
            ))}
            <p data-reveal style={order(afterContents)} className="text-xs text-fg-subtle">
              Usou, {name} fica sabendo na hora. Os vales ficam guardados na Dupla.
            </p>
          </section>
        )}

        <div
          data-reveal
          style={order(afterContents)}
          className="flex flex-col items-center gap-2.5"
        >
          <p aria-live="polite" className="text-sm font-semibold text-fg-muted">
            {reaction ? `${name} vai ver a sua reação` : `Responda pra ${name}`}
          </p>
          <div role="group" aria-label="Reagir ao presente" className="flex gap-2">
            {GIFT_REACTIONS.map((emoji) => {
              const selected = reaction === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Reagir com ${emoji}`}
                  disabled={react.isPending}
                  onClick={() =>
                    previewFor
                      ? setPreviewReaction(emoji)
                      : react.mutate({ giftId: gift.id, emoji })
                  }
                  style={
                    selected ? ({ '--tw-ring-color': wrap.paper } as CSSProperties) : undefined
                  }
                  className={cx(
                    'flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-[background-color,scale] active:scale-90',
                    selected ? 'scale-110 bg-fg/15 ring-2' : 'bg-fg/5 hover:bg-fg/10',
                  )}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        <div
          data-reveal
          style={order(afterContents + 1)}
          className="flex w-full flex-col items-center gap-2"
        >
          <Button onClick={onClose} className="w-full">
            {previewFor ? 'Fechar a prévia' : 'Guardar presente'}
          </Button>
          <p className="text-xs text-fg-subtle">
            {previewFor
              ? `É assim que ${previewFor} vai ver. Nada foi enviado ainda.`
              : 'Fica guardado na Dupla, em Presentes.'}
          </p>
        </div>
      </div>
    </div>
  );
}
