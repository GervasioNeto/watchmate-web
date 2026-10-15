import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { cx } from '@/lib/cx';

export function SettingsList({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h2 id={headingId} className="text-sm font-semibold text-fg-muted">
        {title}
      </h2>
      <div className="flex flex-col divide-y divide-line border-y border-line">{children}</div>
    </section>
  );
}

const ROW_CLASSES = 'flex min-h-16 items-center gap-3 py-3';

// Rótulo pequeno em cima, valor embaixo: o miolo de toda linha da lista.
function RowContent({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-xs text-fg-subtle">{label}</span>
      <div className="min-w-0 text-sm text-fg">{children}</div>
    </div>
  );
}

interface SettingsRowProps {
  label: string;
  children: ReactNode;
  action?: ReactNode;
}

export function SettingsRow({ label, children, action }: SettingsRowProps) {
  return (
    <div className={ROW_CLASSES}>
      <RowContent label={label}>{children}</RowContent>
      {action}
    </div>
  );
}

interface SettingsLinkRowProps {
  to: string;
  label: string;
  children: ReactNode;
}

// Linha que leva para outra página: mostra um resumo, e o ajuste em si fica lá.
export function SettingsLinkRow({ to, label, children }: SettingsLinkRowProps) {
  return (
    <Link to={to} className={cx(ROW_CLASSES, 'group rounded-md')}>
      <RowContent label={label}>{children}</RowContent>
      <ChevronRight
        size={18}
        aria-hidden
        className="shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
      />
    </Link>
  );
}

interface EditableTextRowProps {
  label: string;
  value: string;
  placeholder: string;
  onSave: (value: string) => Promise<unknown>;
}

// Mostra o valor como texto; o campo só aparece ao clicar em "Editar".
export function EditableTextRow({ label, value, placeholder, onSave }: EditableTextRowProps) {
  const inputId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);

  // Ao fechar a edição, o foco volta para o botão "Editar".
  useEffect(() => {
    if (!isEditing && restoreFocus.current) {
      restoreFocus.current = false;
      containerRef.current?.querySelector('button')?.focus();
    }
  }, [isEditing]);

  function stopEditing() {
    restoreFocus.current = true;
    setIsEditing(false);
  }

  function startEditing() {
    setDraft(value);
    setError(null);
    setIsEditing(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      stopEditing();
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      stopEditing();
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div ref={containerRef}>
        <SettingsRow
          label={label}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={startEditing}
              aria-label={`Editar ${label}`}
              className="-mr-3"
            >
              Editar
            </Button>
          }
        >
          {value ? (
            <span className="block truncate">{value}</span>
          ) : (
            <span className="text-fg-subtle">{placeholder}</span>
          )}
        </SettingsRow>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') stopEditing();
      }}
      className="flex flex-col gap-2 py-3"
    >
      <label htmlFor={inputId} className="text-xs text-fg-subtle">
        {label}
      </label>
      <TextInput
        id={inputId}
        type="text"
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" isLoading={isSaving} disabled={!draft.trim()}>
          Salvar
        </Button>
        <Button variant="ghost" size="sm" onClick={stopEditing}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
