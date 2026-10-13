import { useId, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { CoupleHero } from '@/components/profile/CoupleHero';
import { EditableTextRow, SettingsList, SettingsRow } from '@/components/profile/SettingsList';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouple } from '@/hooks/useCouple';
import { useGroup, usePatchGroup } from '@/hooks/useGroup';
import { useMe, usePatchMe } from '@/hooks/useMe';
import { AVATAR_STYLES } from '@/lib/avatarStyles';
import { supabase } from '@/lib/supabase';

export function ProfilePage() {
  const { data: me } = useMe();
  const { me: mePerson, partner } = useCouple();
  const { data: group, isLoading: isGroupLoading } = useGroup();
  const patchMe = usePatchMe();
  const patchGroup = usePatchGroup();
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);
  const avatarPickerId = useId();

  if (!isGroupLoading && group === null) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-svh">
      <AppHeader />

      <main className="mx-auto flex max-w-xl flex-col gap-8 px-4 pt-6 pb-16">
        {mePerson && group ? (
          <CoupleHero
            me={mePerson}
            partner={partner}
            groupName={group.nome}
            since={group.criadoEm}
            inviteCode={partner ? null : group.codigoConvite}
          />
        ) : (
          <Skeleton className="h-72 rounded-lg" />
        )}

        {mePerson && me && (
          <SettingsList title="Você">
            <SettingsRow
              label="Avatar"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPickingAvatar((open) => !open)}
                  aria-expanded={isPickingAvatar}
                  aria-controls={isPickingAvatar ? avatarPickerId : undefined}
                  className="-mr-3"
                >
                  {isPickingAvatar ? 'Pronto' : mePerson.avatar ? 'Trocar' : 'Escolher'}
                </Button>
              }
            >
              <span className="flex items-center gap-2">
                <Avatar person={mePerson} size="sm" />
                {mePerson.avatar ? AVATAR_STYLES[mePerson.avatar.style].label : 'Sua inicial'}
              </span>
            </SettingsRow>
            {isPickingAvatar && (
              <div id={avatarPickerId} className="py-3">
                <AvatarPicker me={mePerson} />
              </div>
            )}
            <EditableTextRow
              label="Nome"
              value={me.nome ?? ''}
              placeholder="Como aparece para o seu par"
              onSave={(value) => patchMe.mutateAsync(value)}
            />
            <SettingsRow label="E-mail">
              <span className="block truncate">{me.email}</span>
            </SettingsRow>
          </SettingsList>
        )}

        {group && (
          <SettingsList title="A dupla">
            <EditableTextRow
              label="Nome do grupo"
              value={group.nome ?? ''}
              placeholder="Dê um nome para a dupla"
              onSave={(value) => patchGroup.mutateAsync(value)}
            />
            <SettingsRow label="Seu par">
              {partner ? (
                <span className="flex items-center gap-2">
                  <Avatar person={partner} size="sm" />
                  <span className="truncate">{partner.name}</span>
                </span>
              ) : (
                <span className="text-fg-subtle">Ainda não entrou. O código está lá em cima.</span>
              )}
            </SettingsRow>
          </SettingsList>
        )}

        <Button
          variant="ghost"
          onClick={() => supabase.auth.signOut()}
          className="-ml-4 self-start"
        >
          <LogOut size={16} aria-hidden />
          Sair da conta
        </Button>
      </main>
    </div>
  );
}
