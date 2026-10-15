import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { CoupleAvatars } from '@/components/couple/CoupleAvatars';
import {
  BUBBLE_CLASSES,
  BubbleTail,
  NOTE_COLOR_CLASSES,
  NoteBubble,
  NoteContent,
} from '@/components/couple/NoteBubble';
import { NoteEditor } from '@/components/couple/NoteEditor';
import { useCoupleNotes, useIsNewNote } from '@/hooks/useCoupleNotes';
import { cx } from '@/lib/cx';
import { formatTimeAgo } from '@/lib/dates';
import type { Person } from '@/lib/people';

interface CoupleStageProps {
  me: Person;
  partner: Person | null;
}

// Os dois lado a lado, cada um com o seu balão de recado: o seu à esquerda (toque para
// escrever), o do seu par à direita. Os avatares ficam no centro, e cada rabinho aponta
// para o dono do balão. Sem par ainda, fica o lugar vazio no sofá e nenhum balão.
// Feito para o fundo `surface` do card da dupla.
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

  // Escrito: branco. Vazio: neutro, como um convite para escrever.
  const myColor = notes.mine ? NOTE_COLOR_CLASSES : 'bg-surface-2';

  return (
    // 20px até os avatares: o rabinho (12px) para um pouco antes do anel de cada um.
    <div className="flex flex-col gap-5">
      {partner &&
        (isEditing ? (
          <NoteEditor partner={partner} note={notes.mine} onClose={() => setIsEditing(false)} />
        ) : (
          // 20px entre os balões: com o rabinho 24px para dentro, a ponta cai 34px para o
          // lado do meio, no centro de cada avatar do par (ver CoupleAvatars e BubbleTail).
          <div className="grid grid-cols-2 items-end gap-5">
            <div className="flex min-w-0 justify-end">
              <button
                ref={myBubbleRef}
                type="button"
                onClick={() => setIsEditing(true)}
                className={cx(
                  BUBBLE_CLASSES,
                  // Só o brilho anima: `transition` animaria também a cor do contorno de foco.
                  'px-3 py-2 transition-[filter]',
                  myColor,
                  // No branco o hover escurece um pouco; no neutro, clareia.
                  notes.mine ? 'hover:brightness-95' : 'text-fg-muted hover:brightness-125',
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
                <NoteBubble colorClass={NOTE_COLOR_CLASSES} tail="start" isNew={isPartnerNoteNew}>
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
        <CoupleAvatars me={me} partner={partner} size="lg" />
      </div>
    </div>
  );
}
