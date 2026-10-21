import { useId } from 'react';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { CUSTOM_TIME, type SessionTimeDraft } from '@/lib/invites';

interface SessionTimePickerProps {
  label: string;
  draft: SessionTimeDraft;
  onChange: (draft: SessionTimeDraft) => void;
}

// As horas prontas em pílulas e, no fim, "Outro", que abre o relógio do celular.
export function SessionTimePicker({ label, draft, onChange }: SessionTimePickerProps) {
  const inputId = useId();

  return (
    <div className="flex flex-col gap-3">
      <ChipGroup
        label={label}
        options={[
          ...draft.choices.map((choice) => ({ value: choice.value, label: choice.label })),
          { value: CUSTOM_TIME, label: 'Outro' },
        ]}
        value={draft.selected}
        onChange={(selected) => onChange({ ...draft, selected })}
        bleed
      />
      {draft.selected === CUSTOM_TIME && (
        <div className="flex items-center gap-3">
          <label htmlFor={inputId} className="text-sm text-fg-muted">
            Que horas?
          </label>
          <input
            id={inputId}
            type="time"
            value={draft.custom}
            onChange={(event) => onChange({ ...draft, custom: event.target.value })}
            className="min-h-11 rounded-md border border-line bg-surface-2 px-3 font-mono text-base text-fg tabular-nums"
          />
          <span className="text-xs text-fg-subtle">Já passou? Fica pra amanhã.</span>
        </div>
      )}
    </div>
  );
}
