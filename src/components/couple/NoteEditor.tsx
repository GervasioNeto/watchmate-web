import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { BUBBLE_CLASSES } from '@/components/couple/NoteBubble';
import { Button } from '@/components/ui/Button';
import { useSaveNote } from '@/hooks/useCoupleNotes';
import { cx } from '@/lib/cx';
import { normalizeNote, NOTE_MAX_LENGTH, type Note } from '@/lib/notes';
import type { Person } from '@/lib/people';

interface NoteEditorProps {
  partner: Person;
  note: Note | null;
  onClose: () => void;
}

// O contador só aparece perto do limite, para não poluir o balão.
const COUNTER_FROM = NOTE_MAX_LENGTH - 20;

// O seu balão em modo rascunho: neutro enquanto você escreve, na sua cor depois de salvo.
// Enter salva, Esc cancela. Salvar vazio apaga o recado.
export function NoteEditor({ partner, note, onClose }: NoteEditorProps) {
  const inputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(note?.text ?? '');
  const save = useSaveNote();

  // Abre com o cursor no fim do texto, pronto para continuar ou apagar.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, []);

  const submit = (value: string | null) => {
    save.mutate(value, { onSuccess: onClose });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (save.isPending) return;
    const normalized = normalizeNote(text);
    if (normalized === (note?.text ?? '')) {
      onClose();
      return;
    }
    submit(normalized || null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
    if (event.key === 'Escape' && !save.isPending) {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cx(
        BUBBLE_CLASSES,
        'flex flex-col gap-2 bg-surface-2 p-3',
        'has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-accent',
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        Seu recado para {partner.shortName}
      </label>
      <textarea
        id={inputId}
        ref={textareaRef}
        value={text}
        // O recado é uma linha só: uma quebra colada vira espaço.
        onChange={(event) => setText(event.target.value.replace(/\n/g, ' '))}
        onKeyDown={handleKeyDown}
        maxLength={NOTE_MAX_LENGTH}
        rows={2}
        enterKeyHint="send"
        readOnly={save.isPending}
        placeholder={`Escreva algo para ${partner.shortName}…`}
        // 16px no celular evita o zoom automático do iOS ao focar.
        className="field-sizing-content min-h-11 w-full resize-none bg-transparent text-base text-fg placeholder:text-fg-subtle focus-visible:outline-none sm:text-sm"
      />

      <div className="flex items-center gap-1">
        {note && (
          <Button
            size="sm"
            variant="danger"
            className="-ml-2"
            disabled={save.isPending}
            onClick={() => submit(null)}
          >
            Apagar
          </Button>
        )}
        <span
          aria-live="polite"
          className={cx(
            'ml-auto px-1 text-xs tabular-nums',
            text.length >= NOTE_MAX_LENGTH ? 'text-danger' : 'text-fg-subtle',
          )}
        >
          {text.length >= COUNTER_FROM && `${text.length}/${NOTE_MAX_LENGTH}`}
        </span>
        <Button size="sm" variant="ghost" disabled={save.isPending} onClick={onClose}>
          Cancelar
        </Button>
        <Button size="sm" type="submit" isLoading={save.isPending}>
          Salvar
        </Button>
      </div>

      {save.isError && (
        <p role="alert" className="text-xs text-danger">
          Não deu para salvar o recado. Tente de novo.
        </p>
      )}
    </form>
  );
}
