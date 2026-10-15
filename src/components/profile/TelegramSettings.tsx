import { useId, useState, type ReactNode } from 'react';
import { Check, ChevronDown, ExternalLink, LoaderCircle, ShieldCheck } from 'lucide-react';
import { TelegramLogo } from '@/components/profile/TelegramLogo';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useCouple } from '@/hooks/useCouple';
import { useSeries } from '@/hooks/useSeries';
import { useSetTelegram } from '@/hooks/useTelegram';
import { cx } from '@/lib/cx';
import type { TelegramState } from '@/types/api';

// O botão com a cor do Telegram: o mesmo tamanho do Button "md", em <button> ou <a>.
const TELEGRAM_BUTTON =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-telegram px-4 py-2.5 text-sm leading-tight font-semibold text-on-telegram transition-[filter] select-none hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50';

// A linha do Telegram na seção Avisos (ver AlertsSection). Abre para baixo: fechada, mostra
// o estado; aberta, explica o que o bot faz e conecta. Abre sozinha enquanto a conexão
// espera o "Iniciar" e quando ela dá certo.
export function TelegramSettings({ state }: { state: TelegramState }) {
  const { partner } = useCouple();
  const setTelegram = useSetTelegram();
  const panelId = useId();
  const switchLabelId = useId();
  const switchHintId = useId();
  const [isOpen, setIsOpen] = useState(state.status === 'pending');
  const [justConnected, setJustConnected] = useState(false);
  const [lastStatus, setLastStatus] = useState(state.status);

  if (lastStatus !== state.status) {
    setLastStatus(state.status);
    if (state.status === 'pending') setIsOpen(true);
    if (lastStatus === 'pending' && state.status === 'on') {
      setJustConnected(true);
      setIsOpen(true);
    }
  }

  const partnerName = partner?.shortName ?? null;
  const bot = state.botUsername ? `@${state.botUsername}` : 'bot do WatchMate';
  const isOn = state.status === 'on';

  // Ligar: com a conta conectada, religa na hora; sem ela (ou com o bot bloqueado), a API
  // devolve o link e o Telegram abre. Se o navegador barrar a nova aba, o botão "Abrir o
  // Telegram" do passo seguinte resolve.
  async function turnOn() {
    setJustConnected(false);
    try {
      const next = await setTelegram.mutateAsync(true);
      if (next.status === 'pending' && next.linkUrl) {
        window.open(next.linkUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      // O erro aparece embaixo (setTelegram.isError).
    }
  }

  function turnOff() {
    setJustConnected(false);
    setTelegram.mutate(false);
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="group flex min-h-16 w-full items-center gap-3 rounded-md py-3 text-left"
      >
        <TelegramLogo className="h-9 w-9" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold text-fg">Telegram</span>
          <span className="truncate text-xs text-fg-muted">{summary(state, partnerName)}</span>
        </span>
        {isOn && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-fg-muted">
            <span aria-hidden className="h-2 w-2 rounded-full bg-telegram" />
            Ligado
          </span>
        )}
        <ChevronDown
          size={18}
          aria-hidden
          className={cx(
            'shrink-0 text-fg-muted transition-transform group-hover:text-fg',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div id={panelId} className="flex flex-col gap-6 pt-1 pb-5">
          {state.status === 'off' && (
            <>
              <p className="text-sm leading-relaxed text-fg-muted">
                O <span className="font-semibold text-fg">{bot}</span> te manda uma mensagem no
                Telegram quando {partnerName ?? 'seu par'} mexe na lista de vocês. Útil para quem
                usa o WatchMate pelo navegador.
              </p>
              <MessagePreview partnerName={partnerName} />
              <ConnectSteps current={0} bot={bot} />
              <TrustNote />
              <button
                type="button"
                onClick={turnOn}
                disabled={setTelegram.isPending}
                className={cx(TELEGRAM_BUTTON, 'w-full sm:w-auto sm:self-start')}
              >
                {setTelegram.isPending ? (
                  <LoaderCircle size={18} aria-hidden className="animate-spin" />
                ) : (
                  <TelegramLogo variant="mono" className="h-5 w-5" />
                )}
                Conectar com Telegram
              </button>
            </>
          )}

          {state.status === 'pending' && (
            <>
              <ConnectSteps current={1} bot={bot} />
              <div className="flex flex-wrap items-center gap-2">
                {state.linkUrl && (
                  <a
                    href={state.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cx(TELEGRAM_BUTTON, 'flex-1 sm:flex-none')}
                  >
                    <TelegramLogo variant="mono" className="h-5 w-5" />
                    Abrir o Telegram
                  </a>
                )}
                <Button variant="ghost" onClick={turnOff} disabled={setTelegram.isPending}>
                  Cancelar
                </Button>
              </div>
              <div className="flex flex-col gap-1">
                <p role="status" className="flex items-center gap-2 text-sm font-semibold text-fg">
                  <LoaderCircle size={16} aria-hidden className="animate-spin text-telegram" />
                  Esperando você tocar em "Iniciar"…
                </p>
                <p className="text-xs text-fg-subtle">
                  A conexão aparece aqui sozinha. O link vale por 15 minutos.
                </p>
              </div>
            </>
          )}

          {(state.status === 'on' || state.status === 'paused') && (
            <>
              {justConnected && (
                <p
                  role="status"
                  className="flex items-start gap-2.5 rounded-md bg-surface-2 px-3 py-2.5 text-sm text-fg"
                >
                  <Check size={18} aria-hidden className="mt-px shrink-0 text-telegram" />
                  <span>
                    Tudo certo! Os avisos vão chegar{' '}
                    {state.username ? `para @${state.username}` : 'na sua conta'} no Telegram.
                  </span>
                </p>
              )}
              <div className="flex items-center gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span id={switchLabelId} className="text-sm font-semibold text-fg">
                    Receber avisos
                  </span>
                  <span id={switchHintId} className="text-xs text-fg-muted">
                    {isOn
                      ? 'Série nova e episódio visto chegam no seu Telegram.'
                      : 'Pausados: nada chega até você ligar de novo.'}
                  </span>
                </div>
                <Switch
                  checked={isOn}
                  onChange={(on) => (on ? turnOn() : turnOff())}
                  isBusy={setTelegram.isPending}
                  aria-labelledby={switchLabelId}
                  aria-describedby={switchHintId}
                />
              </div>
              <MessagePreview partnerName={partnerName} />
              {state.botUsername && (
                <div className="flex flex-col gap-1">
                  <a
                    href={`https://t.me/${state.botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-semibold text-fg hover:underline"
                  >
                    Abrir a conversa com {bot}
                    <ExternalLink size={14} aria-hidden className="text-fg-muted" />
                  </a>
                  <p className="text-xs text-fg-subtle">
                    Por lá, mandar /parar também pausa os avisos.
                  </p>
                </div>
              )}
            </>
          )}

          {setTelegram.isError && (
            <p role="alert" className="text-sm text-danger">
              Não foi possível falar com o WatchMate agora. Tente de novo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// A linha de baixo do "Telegram", com o painel fechado.
function summary(state: TelegramState, partnerName: string | null): string {
  switch (state.status) {
    case 'pending':
      return 'Esperando você tocar em "Iniciar" no Telegram';
    case 'on':
      return state.username ? `Conectado como @${state.username}` : 'Conectado';
    case 'paused':
      return 'Conectado, com os avisos pausados';
    default:
      return `Avisos de ${partnerName ?? 'seu par'} no seu Telegram`;
  }
}

const STEPS: Array<{ title: string; detail: (bot: string) => string }> = [
  {
    title: 'Toque em "Conectar com Telegram"',
    detail: (bot) => `O Telegram abre na conversa com o ${bot}.`,
  },
  {
    title: 'Toque em "Iniciar"',
    detail: () => 'É o botão no pé da conversa. Ele confirma que a conta é sua.',
  },
  {
    title: 'Volte para cá',
    detail: () => 'A conexão aparece sozinha, sem precisar recarregar.',
  },
];

// Os três passos da conexão. `current` é o passo em que a pessoa está; os anteriores
// aparecem como feitos.
function ConnectSteps({ current, bot }: { current: number; bot: string }) {
  return (
    <ol aria-label="Como conectar" className="flex flex-col gap-3.5">
      {STEPS.map((step, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        return (
          <li
            key={step.title}
            aria-current={isCurrent ? 'step' : undefined}
            className="flex items-start gap-3"
          >
            <span
              aria-hidden
              className={cx(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                isDone && 'bg-telegram text-on-telegram',
                isCurrent && 'border-2 border-telegram text-telegram',
                !isDone && !isCurrent && 'border border-line text-fg-subtle',
              )}
            >
              {isDone ? <Check size={14} strokeWidth={3} /> : index + 1}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
              <span
                className={cx(
                  'text-sm font-semibold',
                  isDone ? 'text-fg-muted line-through decoration-fg-subtle' : 'text-fg',
                )}
              >
                {step.title}
                {isDone && <span className="sr-only"> (feito)</span>}
              </span>
              <span className="text-xs leading-relaxed text-fg-muted">{step.detail(bot)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Como os avisos chegam: as duas mensagens que o bot manda, com o nome do seu par e a série
// mais recente de vocês, no jeito de uma conversa do Telegram.
function MessagePreview({ partnerName }: { partnerName: string | null }) {
  const { data: series } = useSeries();
  const name = partnerName ?? 'Seu par';
  const seriesName = series?.[0]?.nome ?? null;

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-xs font-semibold text-fg-subtle">
        Como os avisos chegam
      </figcaption>
      {/* Um recorte mais escuro dentro do cartão, como a tela de uma conversa. */}
      <div className="flex flex-col gap-1.5 rounded-lg bg-canvas p-3">
        <span className="text-xs font-bold text-telegram">WatchMate</span>
        <PreviewBubble>
          🍿 <b>{name}</b> adicionou {seriesName ? <b>{seriesName}</b> : 'uma série nova'} à lista
          de vocês.
        </PreviewBubble>
        <PreviewBubble>
          👀 <b>{name}</b> viu{' '}
          {seriesName ? (
            <>
              o T1 · E5 de <b>{seriesName}</b>
            </>
          ) : (
            'um episódio sem você'
          )}
          .
        </PreviewBubble>
      </div>
    </figure>
  );
}

function PreviewBubble({ children }: { children: ReactNode }) {
  return (
    <p className="self-start rounded-lg rounded-tl-sm bg-surface-2 px-3 py-2 text-sm leading-snug text-fg [&_b]:font-semibold">
      {children}
    </p>
  );
}

function TrustNote() {
  return (
    <p className="flex gap-2.5 text-xs leading-relaxed text-fg-muted">
      <ShieldCheck size={16} aria-hidden className="mt-px shrink-0 text-fg-subtle" />
      <span>
        O bot só envia avisos: não lê suas conversas e não tem acesso à sua conta do Telegram. Dá
        para pausar quando quiser, aqui ou mandando /parar para ele.
      </span>
    </p>
  );
}
