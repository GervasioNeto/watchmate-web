import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { InviteCode } from '@/components/InviteCode';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useCouple } from '@/hooks/useCouple';
import { useGroup, usePatchGroup } from '@/hooks/useGroup';
import { useMe, usePatchMe } from '@/hooks/useMe';
import { supabase } from '@/lib/supabase';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-5">
      <h2 className="text-sm font-semibold text-fg-muted">{title}</h2>
      {children}
    </section>
  );
}

interface NameFormProps {
  id: string;
  label: string;
  initialValue: string;
  placeholder: string;
  onSave: (value: string) => Promise<unknown>;
  isSaving: boolean;
}

function NameForm({ id, label, initialValue, placeholder, onSave, isSaving }: NameFormProps) {
  const [value, setValue] = useState(initialValue);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // Quando o valor salvo muda (carregou do servidor ou acabou de salvar), o campo acompanha.
  const [syncedInitial, setSyncedInitial] = useState(initialValue);
  if (initialValue !== syncedInitial) {
    setSyncedInitial(initialValue);
    setValue(initialValue);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    try {
      await onSave(value.trim());
      setFeedback({ ok: true, message: 'Salvo.' });
    } catch {
      setFeedback({ ok: false, message: 'Não foi possível salvar.' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <div className="flex gap-2">
        <TextInput
          id={id}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="secondary"
          isLoading={isSaving}
          disabled={!value.trim() || value.trim() === initialValue}
        >
          Salvar
        </Button>
      </div>
      {feedback && (
        <p role="status" className={feedback.ok ? 'text-sm text-fg-muted' : 'text-sm text-danger'}>
          {feedback.message}
        </p>
      )}
    </form>
  );
}

export function ProfilePage() {
  const { data: me } = useMe();
  const couple = useCouple();
  const { data: group, isLoading: isGroupLoading } = useGroup();
  const patchMe = usePatchMe();
  const patchGroup = usePatchGroup();
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);
  const avatarPickerId = useId();

  if (!isGroupLoading && group === null) {
    return <Navigate to="/onboarding" replace />;
  }

  const people = [couple.me, couple.partner].filter((person) => person !== null);

  return (
    <div className="min-h-svh">
      <AppHeader />

      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 pt-6 pb-16">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar person={couple.me} size="lg" />
            <div className="flex min-w-0 flex-col items-start gap-1">
              <h1 className="max-w-full truncate text-2xl font-extrabold tracking-tight">
                {couple.me?.name ?? 'Seu perfil'}
              </h1>
              <p className="max-w-full truncate text-sm text-fg-muted">{me?.email}</p>
              {couple.me && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPickingAvatar((open) => !open)}
                  aria-expanded={isPickingAvatar}
                  aria-controls={isPickingAvatar ? avatarPickerId : undefined}
                  className="-ml-3"
                >
                  {isPickingAvatar
                    ? 'Pronto'
                    : couple.me.avatar
                      ? 'Trocar avatar'
                      : 'Escolher avatar'}
                </Button>
              )}
            </div>
          </div>
          {isPickingAvatar && couple.me && (
            <div id={avatarPickerId}>
              <AvatarPicker me={couple.me} />
            </div>
          )}
        </div>

        <Section title="Você">
          <NameForm
            id="profile-name"
            label="Seu nome"
            initialValue={me?.nome ?? ''}
            placeholder="Como aparece para o seu par"
            onSave={(value) => patchMe.mutateAsync(value)}
            isSaving={patchMe.isPending}
          />
        </Section>

        {group && (
          <Section title="Grupo">
            <NameForm
              id="group-name"
              label="Nome do grupo"
              initialValue={group.nome ?? ''}
              placeholder="Nome do grupo"
              onSave={(value) => patchGroup.mutateAsync(value)}
              isSaving={patchGroup.isPending}
            />

            <ul className="flex flex-col gap-2.5">
              {people.map((person) => (
                <li key={person.id} className="flex items-center gap-3">
                  <Avatar person={person} size="sm" />
                  <span className="truncate text-sm">
                    {person.name}
                    {person.role === 'me' && <span className="text-fg-subtle"> (você)</span>}
                  </span>
                </li>
              ))}
            </ul>

            {!couple.partner && couple.me && (
              <div className="flex flex-col gap-1">
                <p className="text-sm text-fg-muted">Código para seu par entrar no grupo</p>
                <InviteCode code={group.codigoConvite} />
              </div>
            )}
          </Section>
        )}

        <div className="border-t border-line pt-5">
          <Button variant="ghost" onClick={() => supabase.auth.signOut()} className="-ml-4">
            Sair da conta
          </Button>
        </div>
      </main>
    </div>
  );
}
