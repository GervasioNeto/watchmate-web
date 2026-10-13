import { useEffect, useRef, useState } from 'react';
import { Pencil, UserPlus } from 'lucide-react';
import {
  BUBBLE_CLASSES,
  BubbleTail,
  NoteBubble,
  NoteContent,
} from '@/components/couple/NoteBubble';
import { NoteEditor } from '@/components/couple/NoteEditor';
import { Avatar } from '@/components/ui/Avatar';
import { useCoupleNotes, useIsNewNote } from '@/hooks/useCoupleNotes';
import { cx } from '@/lib/cx';
import { formatTimeAgo } from '@/lib/dates';
import type { Person } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';

interface CoupleStageProps {
  me: Person;
  partner: Person | null;
}

// Os dois lado a lado, cada um com o seu balão de recado: o seu à esquerda (toque para
// escrever), o do seu par à direita. Os avatares ficam no centro, e cada rabinho aponta
// para o dono do balão; as cores dizem quem é quem. Sem par ainda, fica o lugar vazio
// no sofá e nenhum balão. Feito para o fundo `surface` do card da dupla.
export function CoupleStage({ me, partner }: CoupleStageProps) {
  const notes = useCoupleNotes();
  const isPartnerNoteNew = useIsNewNote(partner?.id ?? null, notes.partner);
  const [isEditing, setIsEditing] = useState(false);
  const myBubbleRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  const now = new Date();

  // Ao fechar o editor, o foco volta para o seu balão.
  useEffect(() => {
    if (wasEditing.current && !isEditing) myBubbleRef.current?.focus();
    wasEditing.current = isEditing;
  }, [isEditing]);

  const myColor = notes.mine ? TONE_CLASSES[me.tone].soft : 'bg-surface-2';

  return (
    <div className="flex flex-col gap-4">
      {partner &&
        (isEditing ? (
          <NoteEditor partner={partner} note={notes.mine} onClose={() => setIsEditing(false)} />
        ) : (
          <div className="grid grid-cols-2 items-end gap-3">
            <div className="flex min-w-0 justify-end">
              <button
                ref={myBubbleRef}
                type="button"
                onClick={() => setIsEditing(true)}
                className={cx(
                  BUBBLE_CLASSES,
                  // Só o brilho anima: `transition` animaria também a cor do contorno de foco.
                  'px-3 py-2 transition-[filter] hover:brightness-125',
                  myColor,
                  !notes.mine && 'text-fg-muted',
                )}
              >
                {notes.mine ? (
                  <>
                    <span className="sr-only">Editar seu recado: </span>
                    <NoteContent text={notes.mine.text} time={formatTimeAgo(notes.mine.at, now)} />
                  </>
                ) : (
                  <span className="flex items-start gap-1.5">
                    <Pencil size={13} aria-hidden className="mt-0.5 shrink-0" />
                    Deixe um recado pra {partner.shortName}
                  </span>
                )}
                <BubbleTail side="end" colorClass={myColor} />
              </button>
            </div>

            <div className="flex min-w-0 justify-start">
              {notes.partner && (
                <NoteBubble
                  colorClass={TONE_CLASSES[partner.tone].soft}
                  tail="start"
                  isNew={isPartnerNoteNew}
                >
                  <span className="sr-only">
                    {isPartnerNoteNew ? 'Recado novo' : 'Recado'} de {partner.shortName}:{' '}
                  </span>
                  <NoteContent
                    text={notes.partner.text}
                    time={formatTimeAgo(notes.partner.at, now)}
                  />
                </NoteBubble>
              )}
            </div>
          </div>
        ))}

      <div className="flex justify-center">
        <Avatar person={me} size="lg" className="ring-4 ring-surface" />
        {partner ? (
          <Avatar person={partner} size="lg" className="-ml-3 ring-4 ring-surface" />
        ) : (
          // Lugar de quem ainda não entrou: opaco, para o anel não ficar sobre o seu avatar.
          <span
            aria-hidden
            className="-ml-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-fg-subtle bg-surface-2 text-fg-subtle ring-4 ring-surface"
          >
            <UserPlus size={20} />
          </span>
        )}
      </div>
    </div>
  );
}
