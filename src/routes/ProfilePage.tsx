import { useId, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { CoupleAvatars } from '@/components/couple/CoupleAvatars';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  EditableTextRow,
  SettingsLinkRow,
  SettingsList,
  SettingsRow,
} from '@/components/ui/SettingsList';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouple } from '@/hooks/useCouple';
import { useGroup } from '@/hooks/useGroup';
import { useMe, usePatchMe } from '@/hooks/useMe';
import { AVATAR_STYLES } from '@/lib/avatarStyles';
import { supabase } from '@/lib/supabase';

// O perfil é sobre você: avatar, nome, e-mail e sair. O que é da dupla (nome do grupo,
// convite, números) fica na página da dupla; daqui sai uma linha para lá.
export function ProfilePage() {
  const { data: me } = useMe();
  const { me: mePerson, partner } = useCouple();
  const { data: group, isLoading: isGroupLoading } = useGroup();
  const patchMe = usePatchMe();
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);
  const avatarPickerId = useId();

  if (!isGroupLoading && group === null) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-svh">
      <AppHeader />

      <main className="mx-auto flex max-w-xl flex-col gap-8 px-4 pt-6 pb-16">
        <h1 className="text-2xl leading-tight font-extrabold tracking-tight">Perfil</h1>

        {mePerson && me ? (
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
        ) : (
          <Skeleton className="h-56 rounded-lg" />
        )}

        {mePerson && group && (
          <SettingsList title="A dupla">
            <SettingsLinkRow
              to="/couple"
              label={partner ? `Você e ${partner.shortName}` : 'Seu par ainda não entrou'}
            >
              <span className="flex items-center gap-2">
                <CoupleAvatars me={mePerson} partner={partner} size="sm" />
                <span className="truncate">{group.nome ?? 'Sem nome'}</span>
              </span>
            </SettingsLinkRow>
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
