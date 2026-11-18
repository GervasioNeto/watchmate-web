import { useId, useState, type CSSProperties } from 'react';
import { CalendarClock, Eye, Gift as GiftIcon } from 'lucide-react';
import { ComposerSection } from '@/components/gifts/composer/ComposerSection';
import { DeliveryPicker } from '@/components/gifts/composer/DeliveryPicker';
import { LetterField } from '@/components/gifts/composer/LetterField';
import { OccasionPicker } from '@/components/gifts/composer/OccasionPicker';
import { VoucherPicker } from '@/components/gifts/composer/VoucherPicker';
import { WrapStage } from '@/components/gifts/composer/WrapStage';
import { GiftReveal } from '@/components/gifts/GiftReveal';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { useCouple } from '@/hooks/useCouple';
import { useSendGift } from '@/hooks/useGifts';
import { isDev } from '@/lib/env';
import { newDraft, toCreateInput, toPreviewGift, type GiftDraft } from '@/lib/giftDraft';
import { wrapOf } from '@/lib/gifts';
import { deviceTimeZone } from '@/lib/invites';

interface GiftComposerSheetProps {
  open: boolean;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}

// Montar o presente, como embrulhar um de verdade: a caixa no alto (o papel escolhido, e o
// que já vai dentro), a ocasião, a carta escrita no próprio papel em que chega, os vales e
// quando entregar. A folha toda pega a cor do embrulho (--gift-paper, --gift-ribbon,
// --gift-glow). Aqui só mora o rascunho: as regras dele estão em lib/giftDraft.
export function GiftComposerSheet({ open, onClose, returnFocusTo }: GiftComposerSheetProps) {
  const messageId = useId();
  const { me, partner } = useCouple();
  const send = useSendGift();
  const [draft, setDraft] = useState<GiftDraft>(() => newDraft(new Date()));
  // "Ver como chega" (só no `npm run dev`): a mesma surpresa que o par vai ver, montada com o
  // rascunho, para conferir o visual sem mandar nada.
  const [previewing, setPreviewing] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setDraft(newDraft(new Date()));
      setPreviewing(false);
    }
  }

  if (!me || !partner) return null;

  const now = new Date();
  const wrap = wrapOf(draft.wrap);
  const input = toCreateInput(draft, now, deviceTimeZone());
  const hasLetter = draft.message.trim().length > 0;
  const update = (patch: Partial<GiftDraft>) => setDraft({ ...draft, ...patch });

  function close() {
    send.reset();
    onClose();
  }

  function submit() {
    if (input) send.mutate(input, { onSuccess: close });
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={`Um presente pra ${partner.shortName}`}
      description="Abre com uma explosão de corações quando chegar."
      returnFocusTo={returnFocusTo}
      footer={
        <div className="flex flex-col gap-2">
          {send.isError && (
            <p role="alert" className="text-sm text-danger">
              {send.error.message || 'Não deu para mandar. Tente de novo.'}
            </p>
          )}
          <div className="flex gap-2">
            {isDev && (
              <Button
                variant="secondary"
                aria-haspopup="dialog"
                onClick={() => setPreviewing(true)}
                disabled={!hasLetter}
                className="shrink-0"
              >
                <Eye size={18} strokeWidth={2.25} aria-hidden />
                Ver como chega
              </Button>
            )}
            <Button
              onClick={submit}
              isLoading={send.isPending}
              disabled={!input}
              className="min-w-0 flex-1"
            >
              {/* Carregando, o Button já mostra o spinner no lugar do ícone. */}
              {!send.isPending &&
                (draft.when === 'now' ? (
                  <GiftIcon size={18} strokeWidth={2.25} aria-hidden />
                ) : (
                  <CalendarClock size={18} strokeWidth={2.25} aria-hidden />
                ))}
              {draft.when === 'now' ? 'Mandar' : 'Agendar'}
            </Button>
          </div>
        </div>
      }
    >
      <div
        style={
          {
            '--gift-paper': wrap.paper,
            '--gift-ribbon': wrap.ribbon,
            '--gift-glow': wrap.glow,
          } as CSSProperties
        }
        className="flex flex-col gap-8 pb-2"
      >
        <WrapStage
          value={draft.wrap}
          onChange={(value) => update({ wrap: value })}
          hasLetter={hasLetter}
          voucherCount={draft.vouchers.length}
        />

        <ComposerSection label="A ocasião">
          <OccasionPicker value={draft.occasion} onChange={(occasion) => update({ occasion })} />
        </ComposerSection>

        <ComposerSection label={`Sua carta pra ${partner.shortName}`} labelFor={messageId}>
          <LetterField
            id={messageId}
            value={draft.message}
            onChange={(message) => update({ message })}
            occasion={draft.occasion}
            wrap={wrap}
            to={partner.shortName}
            from={me.shortName}
          />
        </ComposerSection>

        <ComposerSection label="Vales" hint="se quiser">
          <VoucherPicker draft={draft} onChange={setDraft} />
        </ComposerSection>

        <ComposerSection label="A entrega">
          <DeliveryPicker
            draft={draft}
            onChange={setDraft}
            partnerName={partner.shortName}
            now={now}
          />
        </ComposerSection>
      </div>

      {isDev && previewing && (
        <GiftReveal
          gift={toPreviewGift(draft, now, { fromId: me.id, toId: partner.id })}
          from={me}
          open
          onClose={() => setPreviewing(false)}
          previewFor={partner.shortName}
        />
      )}
    </Sheet>
  );
}
