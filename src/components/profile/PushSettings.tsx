import { useId } from 'react';
import { Switch } from '@/components/ui/Switch';
import { useCouple } from '@/hooks/useCouple';
import type { PushStatus, usePushNotifications } from '@/hooks/usePushNotifications';

type PushControls = ReturnType<typeof usePushNotifications>;

// A linha "Notificações do app" da seção Avisos: liga e desliga o push neste aparelho (o
// celular e o computador ligam cada um o seu). Embaixo do nome, o que chega, ou, quando não
// dá para ligar, o motivo e o caminho.
export function PushSettings({ push }: { push: PushControls }) {
  const { partner } = useCouple();
  const titleId = useId();
  const hintId = useId();
  const canToggle = push.status === 'on' || push.status === 'off' || push.status === 'loading';

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex min-h-10 items-center gap-3">
        <img
          src="/icons/apple-touch-icon.png"
          alt=""
          className="h-9 w-9 shrink-0 rounded-md ring-1 ring-line"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span id={titleId} className="text-sm font-semibold text-fg">
            Notificações do app
          </span>
          <span id={hintId} className="text-xs text-fg-muted">
            {hint(push.status, partner?.shortName ?? 'seu par')}
          </span>
        </span>
        {canToggle && (
          <Switch
            checked={push.isOn}
            onChange={(on) => (on ? push.turnOn() : push.turnOff())}
            isBusy={push.isBusy}
            disabled={push.status === 'loading'}
            aria-labelledby={titleId}
            aria-describedby={hintId}
          />
        )}
      </div>
      {push.isError && (
        <p role="alert" className="text-sm text-danger">
          Não foi possível mudar as notificações agora. Tente de novo.
        </p>
      )}
    </div>
  );
}

function hint(status: PushStatus, partnerName: string): string {
  switch (status) {
    case 'on':
      return 'Ligadas neste aparelho, mesmo com o app fechado.';
    case 'denied':
      return 'Bloqueadas neste navegador. Para ligar, permita as notificações do WatchMate nas configurações do site.';
    case 'needs-install':
      return 'No iPhone, elas chegam pelo app instalado. Instale na seção App, aqui embaixo.';
    case 'loading':
      return 'Conferindo este aparelho…';
    default:
      return `Recados, comentários, reações e episódios de ${partnerName}, mesmo com o app fechado.`;
  }
}
