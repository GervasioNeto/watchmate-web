import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { CoupleAvatars } from '@/components/couple/CoupleAvatars';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { ColorPicker } from '@/components/profile/ColorPicker';
import { InstallAppSection } from '@/components/profile/InstallAppSection';
import { ProfileTicket, type ProfileEditor } from '@/components/profile/ProfileTicket';
import { TelegramSection } from '@/components/profile/TelegramSettings';
import { Button } from '@/components/ui/Button';
import {
  EditableTextRow,
  SettingsLinkRow,
  SettingsList,
  SettingsRow,
} from '@/components/ui/SettingsList';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouple } from '@/hooks/useCouple';
import { useGroup } from '@/hooks/useGroup';
import { useMe, usePatchMe } from '@/hooks/useMe';
import { useProfileHighlights } from '@/hooks/useProfileHighlights';
import { formatMonth } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

// O perfil é sobre você: em cima, o ingresso (quem você é, a sua cor na dupla e os seus
// números); embaixo, os ajustes da conta, a entrada para a página da dupla, os avisos e a
// instalação como app.
export function ProfilePage() {
  const { data: me } = useMe();
  const { me: mePerson, partner } = useCouple();
  const { data: group, isLoading: isGroupLoading } = useGroup();
  const highlights = useProfileHighlights();
  const patchMe = usePatchMe();
  const [openEditor, setOpenEditor] = useState<ProfileEditor | null>(null);
  // Fica guardado depois de fechar: a folha devolve o foco a ele ao terminar de fechar.
  const [editorTrigger, setEditorTrigger] = useState<HTMLElement | null>(null);

  if (!isGroupLoading && group === null) {
    return <Navigate to="/onboarding" replace />;
  }

  function openSheet(editor: ProfileEditor, trigger: HTMLElement) {
    setEditorTrigger(trigger);
    setOpenEditor(editor);
  }

  const closeSheet = () => setOpenEditor(null);
  // As escolhas valem na hora: o "Pronto" só fecha a folha.
  const doneButton = (
    <Button onClick={closeSheet} className="w-full">
      Pronto
    </Button>
  );

  return (
    <>
      <AppHeader />

      <main className="mx-auto flex max-w-xl flex-col gap-8 px-4 pt-6 pb-16">
        {mePerson && me ? (
          <ProfileTicket
            me={mePerson}
            partner={partner}
            memberSince={new Date(me.criadoEm)}
            highlights={highlights}
            openEditor={openEditor}
            onOpenEditor={openSheet}
          />
        ) : (
          <Skeleton className="h-112 rounded-lg" />
        )}

        {mePerson && (
          <>
            <Sheet
              open={openEditor === 'avatar'}
              onClose={closeSheet}
              title="Seu avatar"
              description={
                partner
                  ? `É como ${partner.shortName} vê você no app.`
                  : 'É como você aparece no app.'
              }
              returnFocusTo={editorTrigger}
              footer={doneButton}
            >
              <AvatarPicker me={mePerson} />
            </Sheet>
            <Sheet
              open={openEditor === 'color'}
              onClose={closeSheet}
              title={partner ? 'Sua cor na dupla' : 'Sua cor'}
              description={
                partner
                  ? `A mesma para você e para ${partner.shortName}: marca o que você vê sem ${partner.shortName}.`
                  : 'Marca os seus episódios nas séries e no calendário.'
              }
              returnFocusTo={editorTrigger}
              footer={doneButton}
            >
              <ColorPicker me={mePerson} partner={partner} />
            </Sheet>
          </>
        )}

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

        <InstallAppSection />

        <Button
          variant="ghost"
          onClick={() => supabase.auth.signOut()}
          className="-ml-4 self-start"
        >
          <LogOut size={16} aria-hidden />
          Sair da conta
        </Button>
      </main>
    </>
  );
}
