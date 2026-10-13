import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { AvatarPicker } from '@/components/AvatarPicker';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { AVATAR_SHAPE, UserAvatar } from '@/components/UserAvatar';
import { useGroup, usePatchGroup } from '@/hooks/useGroup';
import { useMe, usePatchMe } from '@/hooks/useMe';
import { supabase } from '@/lib/supabase';
import { Copy, Pencil } from 'lucide-react';

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
  const [justCopiedInvite, setJustCopiedInvite] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    if (me) setNameInput(me.nome ?? '');
  }, [me?.nome]);

  useEffect(() => {
    if (grupo) setGroupNameInput(grupo.nome ?? '');
  }, [grupo?.nome]);

  if (!isGroupLoading && group === null) {
    return <Navigate to="/onboarding" replace />;
  }

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

      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6">
        <section className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(true)}
            aria-label="Trocar avatar"
            className={`group relative transition-transform active:scale-95 ${AVATAR_SHAPE}`}
          >
            <UserAvatar user={me} fallback="V" className="h-30 w-30 text-2xl" />
            <span className="absolute -right-1.5 -bottom-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-flame text-white ring-2 ring-surface transition-transform group-hover:scale-110">
              <Pencil size={16} />
            </span>
          </button>
          <p className="text-sm text-neutral-400">{me?.email}</p>
        </section>

        <Modal
          open={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          title="Escolha seu avatar"
        >
          <AvatarPicker current={me} onPicked={() => setIsAvatarModalOpen(false)} />
        </Modal>

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

              <div className="flex items-center gap-2">
                <p className="font-mono text-lg font-semibold tracking-[0.2em] text-amber">
                  {grupo.codigoConvite}
                </p>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(grupo.codigoConvite);
                      setJustCopiedInvite(true);
                      window.setTimeout(() => setJustCopiedInvite(false), 1500);
                    }}
                    className="rounded-md p-1.5 text-neutral-400 transition hover:bg-surface-border hover:text-white"
                    title="Copiar código"
                  >
                    <Copy size={17} />
                  </button>

                  <span
                    className={`pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-surface-border px-2 py-1 text-xs text-white transition-all duration-150 ${
                      justCopiedInvite ? 'opacity-100' : 'translate-y-0.5 opacity-0'
                    }`}
                  >
                    Copiado!
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-surface-border pt-4">
              <p className="text-xs text-neutral-400">Membros</p>
              {members.map((member) => (
                <div key={member.usuario.id} className="flex items-center gap-3">
                  <UserAvatar
                    user={member.usuario}
                    tone={member.usuario.id === me?.id ? 'me' : 'partner'}
                    className="h-8 w-8 text-xs"
                  />
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
