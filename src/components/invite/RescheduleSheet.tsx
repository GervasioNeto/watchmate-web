import { useState } from 'react';
import { SessionTimePicker } from '@/components/invite/SessionTimePicker';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { useAnswerInvite } from '@/hooks/useInvites';
import {
  CUSTOM_TIME,
  describeInviteTime,
  getRescheduleChoices,
  nextFullHour,
  resolveSessionTime,
  type SessionTimeDraft,
} from '@/lib/invites';
import type { Invite } from '@/types/api';

interface RescheduleSheetProps {
  invite: Invite;
  open: boolean;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}

function newDraft(invite: Invite, now: Date): SessionTimeDraft {
  const choices = getRescheduleChoices(invite, now);
  return {
    choices,
    selected: choices[0]?.value ?? CUSTOM_TIME,
    custom: nextFullHour(now),
  };
}

// "Topo, mas em outro horário": um pouco depois do combinado, ou a hora que quiser. O
// convite já fica aceito nesse horário (quem chamou recebe "topou, mas às 22h").
export function RescheduleSheet({ invite, open, onClose, returnFocusTo }: RescheduleSheetProps) {
  const answer = useAnswerInvite();
  const [draft, setDraft] = useState(() => newDraft(invite, new Date()));
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setDraft(newDraft(invite, new Date()));
  }

  const now = new Date();
  const at = resolveSessionTime(draft, now);

  function close() {
    answer.reset();
    onClose();
  }

  function submit() {
    if (!at) return;
    answer.mutate(
      { inviteId: invite.id, answer: { answer: 'accept', at: at.toISOString() } },
      { onSuccess: close },
    );
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Topa em outro horário?"
      description={`O combinado era ${describeInviteTime(invite.at, now)}.`}
      returnFocusTo={returnFocusTo}
      footer={
        <div className="flex flex-col gap-2">
          {answer.isError && (
            <p role="alert" className="text-sm text-danger">
              {answer.error.message || 'Não deu para responder. Tente de novo.'}
            </p>
          )}
          <Button onClick={submit} isLoading={answer.isPending} disabled={!at} className="w-full">
            {at ? `Topo ${describeInviteTime(at.toISOString(), now)}` : 'Escolha um horário'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 pb-2">
        <h3 className="text-sm font-bold">Que horas fica bom?</h3>
        <SessionTimePicker label="Outro horário" draft={draft} onChange={setDraft} />
      </div>
    </Sheet>
  );
}
