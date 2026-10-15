import { PushSettings } from '@/components/profile/PushSettings';
import { TelegramSettings } from '@/components/profile/TelegramSettings';
import { SettingsList } from '@/components/ui/SettingsList';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useTelegramState } from '@/hooks/useTelegram';

// A seção "Avisos" do perfil, com os dois jeitos de saber o que o par fez: as notificações
// do app (push, neste aparelho) e o Telegram (para quem usa pelo navegador). Cada linha some
// quando a API está sem aquele canal; sem nenhum dos dois, a seção some.
export function AlertsSection() {
  const push = usePushNotifications();
  const { data: telegram } = useTelegramState();

  const showPush = push.status !== 'unavailable';
  const showTelegram = telegram !== undefined && telegram.status !== 'unavailable';
  if (!showPush && !showTelegram) return null;

  return (
    <SettingsList title="Avisos">
      {showPush && <PushSettings push={push} />}
      {showTelegram && <TelegramSettings state={telegram} />}
    </SettingsList>
  );
}
