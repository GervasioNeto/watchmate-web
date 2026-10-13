import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { Wordmark } from '@/components/Wordmark';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useCreateGroup, useGroup, useJoinGroup } from '@/hooks/useGroup';

type Panel = 'choice' | 'join';

export function OnboardingPage() {
  const { data: group, isLoading: isGroupLoading } = useGroup();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const [panel, setPanel] = useState<Panel>('choice');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isGroupLoading && group) {
    return <Navigate to="/my-list" replace />;
  }

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await joinGroup.mutateAsync(inviteCode.trim().toUpperCase());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar no grupo.');
    }
  }

  async function handleCreate() {
    setError(null);
    try {
      await createGroup.mutateAsync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o grupo.');
    }
  }

  function showPanel(next: Panel) {
    setError(null);
    setPanel(next);
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-8 px-4 py-12">
      <Wordmark className="h-10 self-start" />

      {panel === 'choice' ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Agora, o seu par</h1>
            <p className="text-sm text-fg-muted">
              O WatchMate funciona em dupla. Crie o grupo e mande o código para a outra pessoa, ou
              entre com um código que você recebeu.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleCreate} isLoading={createGroup.isPending}>
              Criar grupo
            </Button>
            <Button variant="secondary" onClick={() => showPanel('join')}>
              Tenho um código
            </Button>
          </div>
        </div>
      ) : (
        <form className="flex flex-col gap-6" onSubmit={handleJoin}>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Entrar no grupo</h1>
            <p className="text-sm text-fg-muted">Digite o código que seu par compartilhou.</p>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            Código de convite
            <TextInput
              type="text"
              required
              autoFocus
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="7K3PQD"
              variant="code"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" isLoading={joinGroup.isPending}>
              Entrar no grupo
            </Button>
            <Button variant="ghost" onClick={() => showPanel('choice')}>
              Voltar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
