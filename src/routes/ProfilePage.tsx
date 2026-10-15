import { useId, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { BackButton } from '@/components/BackButton';
import { CoupleAvatars } from '@/components/couple/CoupleAvatars';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { ProfileTicket } from '@/components/profile/ProfileTicket';
import { TelegramSection } from '@/components/profile/TelegramSettings';
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
import { useProfileHighlights } from '@/hooks/useProfileHighlights';
import { formatMonth } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

// O perfil é sobre você: em cima, o ingresso (quem você é, a sua cor na dupla e os seus
// números); embaixo, os ajustes da conta, a entrada para a página da dupla e os avisos.
export function ProfilePage() {
  const { data: me } = useMe();
  const { me: mePerson, partner } = useCouple();
  const { data: group, isLoading: isGroupLoading } = useGroup();
  const highlights = useProfileHighlights();
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
        <div className="flex flex-col gap-4">
          {/* O botão vem antes no DOM (primeiro no Tab) e fica por cima do canto do ingresso. */}
          <div className="relative">
            <BackButton className="absolute top-2 left-2 z-10" />
            {mePerson && me ? (
              <ProfileTicket
                me={mePerson}
                partner={partner}
                memberSince={new Date(me.criadoEm)}
                highlights={highlights}
                isPickingAvatar={isPickingAvatar}
                avatarPickerId={avatarPickerId}
                onToggleAvatarPicker={() => setIsPickingAvatar((open) => !open)}
              />
            ) : (
              <Skeleton className="h-112 rounded-lg" />
            )}
          </div>

          {isPickingAvatar && mePerson && (
            <div id={avatarPickerId}>
              <AvatarPicker me={mePerson} />
            </div>
          )}
        </div>

        {me && (
          <SettingsList title="Conta">
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

        {mePerson && group && (
          <SettingsList title="A dupla">
            <SettingsLinkRow
              to="/couple"
              label={partner ? `Você e ${partner.shortName}` : 'Seu par ainda não entrou'}
            >
              <span className="flex items-center gap-2">
                <CoupleAvatars me={mePerson} partner={partner} size="sm" />
                <span className="truncate">
                  {group.nome ?? 'Sem nome'}
                  <span className="text-fg-subtle">
                    {' '}
                    · desde {formatMonth(new Date(group.criadoEm))}
                  </span>
                </span>
              </span>
            </SettingsLinkRow>
          </SettingsList>
        )}

        <TelegramSection />

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
