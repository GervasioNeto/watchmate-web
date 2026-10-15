import { useState, type ReactNode } from 'react';
import { Share, SquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SettingsList } from '@/components/ui/SettingsList';
import { Sheet } from '@/components/ui/Sheet';
import { useInstallApp } from '@/hooks/useInstallApp';

const APP_ICON = '/icons/apple-touch-icon.png';

// A seção "App" do perfil: pôr o WatchMate na tela inicial, para abrir como app (em tela
// cheia, sem a barra do navegador). No Android e no computador, "Instalar" abre o pedido do
// próprio navegador; no iPhone esse pedido não existe, então a folha mostra o caminho pelo
// Safari. Já instalado, ou num navegador que não instala, a seção não aparece.
export function InstallAppSection() {
  const { mode, install } = useInstallApp();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideTrigger, setGuideTrigger] = useState<HTMLElement | null>(null);

  if (mode === 'installed' || mode === 'unavailable') return null;

  function handleInstall(trigger: HTMLElement) {
    if (mode === 'prompt') {
      void install();
      return;
    }
    setGuideTrigger(trigger);
    setIsGuideOpen(true);
  }

  return (
    <>
      <SettingsList title="App">
        <div className="flex min-h-16 items-center gap-3 py-3">
          <img src={APP_ICON} alt="" className="h-9 w-9 shrink-0 rounded-md ring-1 ring-line" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold text-fg">WatchMate na tela inicial</span>
            <span className="text-xs text-fg-muted">
              Abre como app, em tela cheia e sem a barra do navegador.
            </span>
          </span>
          <Button
            size="sm"
            variant="secondary"
            aria-haspopup={mode === 'ios' ? 'dialog' : undefined}
            aria-expanded={mode === 'ios' ? isGuideOpen : undefined}
            onClick={(event) => handleInstall(event.currentTarget)}
            className="shrink-0"
          >
            Instalar
          </Button>
        </div>
      </SettingsList>

      <Sheet
        open={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="Instale o WatchMate"
        description="No iPhone e no iPad, a instalação é pelo menu de compartilhar."
        returnFocusTo={guideTrigger}
        footer={
          <Button onClick={() => setIsGuideOpen(false)} className="w-full">
            Entendi
          </Button>
        }
      >
        <InstallSteps />
      </Sheet>
    </>
  );
}

const STEPS: { icon: ReactNode; text: ReactNode }[] = [
  {
    icon: <Share size={20} aria-hidden />,
    text: (
      <>
        Toque em <Strong>Compartilhar</Strong>, na barra do navegador.
      </>
    ),
  },
  {
    icon: <SquarePlus size={20} aria-hidden />,
    text: (
      <>
        Escolha <Strong>Adicionar à Tela de Início</Strong>. Se não aparecer, role a lista.
      </>
    ),
  },
  {
    icon: <img src={APP_ICON} alt="" className="h-7 w-7 rounded-sm" />,
    text: (
      <>
        Toque em <Strong>Adicionar</Strong>. O WatchMate fica junto dos seus apps.
      </>
    ),
  },
];

// Os três toques no Safari, cada um com o ícone que a pessoa vai procurar na tela.
function InstallSteps() {
  return (
    <ol className="flex flex-col gap-2">
      {STEPS.map((step, index) => (
        <li key={index} className="flex items-center gap-3 rounded-md bg-surface-2 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-canvas text-fg">
            {step.icon}
          </span>
          <span className="text-sm leading-snug text-fg-muted">{step.text}</span>
        </li>
      ))}
    </ol>
  );
}

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-fg">{children}</strong>;
}
