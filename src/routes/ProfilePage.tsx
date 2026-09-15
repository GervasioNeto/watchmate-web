import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/Button';
import { useGroup, usePatchGroup } from '@/hooks/useGroup';
import { useMe, usePatchMe } from '@/hooks/useMe';
import { supabase } from '@/lib/supabase';

export function ProfilePage() {
  const { data: me } = useMe();
  const { data: group, isLoading: isGroupLoading } = useGroup();
  const patchMe = usePatchMe();
  const patchGroup = usePatchGroup();

  const grupo = me?.membroDoGrupo?.grupo;
  const members = grupo?.membros ?? [];

  const [nameInput, setNameInput] = useState('');
  const [groupNameInput, setGroupNameInput] = useState('');
  const [nameFeedback, setNameFeedback] = useState<string | null>(null);
  const [groupFeedback, setGroupFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (me) setNameInput(me.nome ?? '');
  }, [me?.nome]);

  useEffect(() => {
    if (grupo) setGroupNameInput(grupo.nome ?? '');
  }, [grupo?.nome]);

  if (!isGroupLoading && group === null) {
    return <Navigate to="/onboarding" replace />;
  }

  const meLetter = (me?.nome ?? me?.email ?? 'V')[0]?.toUpperCase() ?? 'V';

  async function handleSaveName(event: FormEvent) {
    event.preventDefault();
    setNameFeedback(null);
    try {
      await patchMe.mutateAsync(nameInput.trim());
      setNameFeedback('Nome atualizado!');
    } catch {
      setNameFeedback('Não foi possível salvar seu nome.');
    }
  }

  async function handleSaveGroupName(event: FormEvent) {
    event.preventDefault();
    setGroupFeedback(null);
    try {
      await patchGroup.mutateAsync(groupNameInput.trim());
      setGroupFeedback('Nome do grupo atualizado!');
    } catch {
      setGroupFeedback('Não foi possível salvar o nome do grupo.');
    }
  }

  return (
    <div className="min-h-svh pb-16">
      <AppHeader />

      <div className="flex flex-col gap-6 px-4 py-6">
        <section className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ultramarine font-heading text-2xl font-semibold text-white">
            {meLetter}
          </div>
          <p className="text-sm text-neutral-400">{me?.email}</p>
        </section>

        <section className="rounded-2xl border border-surface-border bg-surface-raised p-4">
          <h2 className="font-heading text-sm font-semibold text-white">Seu nome</h2>
          <form onSubmit={handleSaveName} className="mt-3 flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="Como podemos te chamar?"
              className="min-w-0 flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-white outline-none focus:border-flame"
            />
            <Button
              type="submit"
              variant="secondary"
              isLoading={patchMe.isPending}
              disabled={nameInput.trim() === (me?.nome ?? '')}
            >
              Salvar
            </Button>
          </form>
          {nameFeedback && <p className="mt-2 text-xs text-neutral-400">{nameFeedback}</p>}
        </section>

        {grupo && (
          <section className="rounded-2xl border border-surface-border bg-surface-raised p-4">
            <h2 className="font-heading text-sm font-semibold text-white">Nome do grupo</h2>
            <form onSubmit={handleSaveGroupName} className="mt-3 flex gap-2">
              <input
                type="text"
                value={groupNameInput}
                onChange={(event) => setGroupNameInput(event.target.value)}
                placeholder="Nome do grupo"
                className="min-w-0 flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-white outline-none focus:border-flame"
              />
              <Button
                type="submit"
                variant="secondary"
                isLoading={patchGroup.isPending}
                disabled={groupNameInput.trim() === (grupo.nome ?? '')}
              >
                Salvar
              </Button>
            </form>
            {groupFeedback && <p className="mt-2 text-xs text-neutral-400">{groupFeedback}</p>}

            <div className="mt-4 border-t border-surface-border pt-4">
              <p className="text-xs text-neutral-400">Código de convite</p>
              <p className="font-mono text-lg font-semibold tracking-[0.2em] text-amber">
                {grupo.codigoConvite}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-surface-border pt-4">
              <p className="text-xs text-neutral-400">Membros</p>
              {members.map((member) => (
                <div key={member.usuario.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia text-xs font-semibold text-white">
                    {(member.usuario.nome ?? member.usuario.email)[0]?.toUpperCase() ?? '?'}
                  </div>
                  <p className="truncate text-sm text-white">
                    {member.usuario.nome ?? member.usuario.email}
                    {member.usuario.id === me?.id && (
                      <span className="ml-1 text-xs text-neutral-500">(você)</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Button variant="ghost" onClick={() => supabase.auth.signOut()} className="self-center">
          Sair da conta
        </Button>
      </div>
    </div>
  );
}
