import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Wordmark } from '@/components/Wordmark';
import { ApiError } from '@/lib/api';
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
    return <Navigate to="/" replace />;
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

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <div className="mb-8">
        <Wordmark />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface-raised p-6">
        {panel === 'choice' ? (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <h1 className="font-heading text-xl font-semibold text-white">
                Vamos formar a dupla
              </h1>
              <p className="mt-1 text-sm text-neutral-400">
                Crie um grupo e convide seu par, ou entre com um código que já recebeu.
              </p>
            </div>

            {error && <p className="text-center text-sm text-fuchsia">{error}</p>}

            <Button onClick={handleCreate} isLoading={createGroup.isPending} className="w-full">
              Criar grupo
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setError(null);
                setPanel('join');
              }}
              className="w-full"
            >
              Entrar com código
            </Button>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleJoin}>
            <div className="text-center">
              <h1 className="font-heading text-xl font-semibold text-white">
                Entrar em um grupo
              </h1>
              <p className="mt-1 text-sm text-neutral-400">
                Digite o código de convite que seu par compartilhou com você.
              </p>
            </div>

            <label className="flex flex-col gap-1.5 text-sm text-neutral-300">
              Código de convite
              <input
                type="text"
                required
                autoFocus
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="Ex: 7K3PQD"
                className="rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-center font-mono text-lg uppercase tracking-widest text-white outline-none focus:border-flame"
              />
            </label>

            {error && <p className="text-sm text-fuchsia">{error}</p>}

            <Button type="submit" isLoading={joinGroup.isPending} className="w-full">
              Entrar no grupo
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setError(null);
                setPanel('choice');
              }}
            >
              Voltar
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
