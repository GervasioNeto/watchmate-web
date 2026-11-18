import type { ReactNode } from 'react';
import { CalendarClock, LockKeyhole, Sparkles, type LucideIcon } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextInput } from '@/components/ui/TextInput';
import { scheduledAt, type GiftDraft } from '@/lib/giftDraft';
import { formatOpening, toDayString } from '@/lib/gifts';

interface DeliveryPickerProps {
  draft: GiftDraft;
  onChange: (draft: GiftDraft) => void;
  partnerName: string;
  now: Date;
}

// Quando entregar: agora, ou num dia e hora. Agendado, o par já vê a caixinha trancada desde
// já (com a contagem), e só abre na hora: a nota embaixo conta exatamente o que vai acontecer.
export function DeliveryPicker({ draft, onChange, partnerName, now }: DeliveryPickerProps) {
  const at = draft.when === 'scheduled' ? scheduledAt(draft, now) : null;

  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl
        label="Quando entregar"
        options={[
          { value: 'now', label: 'Agora' },
          { value: 'scheduled', label: 'Num dia e hora' },
        ]}
        value={draft.when}
        onChange={(when) => onChange({ ...draft, when })}
      />
      {draft.when === 'scheduled' && (
        <div className="flex gap-2">
          <TextInput
            type="date"
            value={draft.date}
            min={toDayString(now)}
            aria-label="Dia da entrega"
            onChange={(event) => onChange({ ...draft, date: event.target.value })}
            className="flex-1 font-mono tabular-nums"
          />
          <TextInput
            type="time"
            value={draft.time}
            aria-label="Hora da entrega"
            onChange={(event) => onChange({ ...draft, time: event.target.value })}
            className="w-28 font-mono tabular-nums"
          />
        </div>
      )}

      {draft.when === 'now' ? (
        <DeliveryNote icon={Sparkles}>
          Chega na hora. Na próxima vez que {partnerName} abrir o app, a caixinha aparece esperando
          o toque.
        </DeliveryNote>
      ) : at ? (
        <DeliveryNote icon={LockKeyhole}>
          {partnerName} já vê a caixinha no app, trancada, com a contagem regressiva. Só abre{' '}
          <strong className="font-semibold text-fg">{formatOpening(at, now)}</strong>.
        </DeliveryNote>
      ) : (
        <DeliveryNote icon={CalendarClock}>
          Escolha um dia e uma hora que ainda vão chegar.
        </DeliveryNote>
      )}
    </div>
  );
}

function DeliveryNote({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-md bg-surface-2 p-3 text-xs leading-relaxed text-fg-muted">
      <span
        aria-hidden
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--gift-paper)_24%,transparent)] text-(--gift-ribbon)"
      >
        <Icon size={14} strokeWidth={2.5} />
      </span>
      <span className="pt-1">{children}</span>
    </p>
  );
}
