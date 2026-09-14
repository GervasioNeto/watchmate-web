import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Wordmark } from '@/components/Wordmark';
import { useAuth } from '@/context/AuthContext';

const FEATURES = [
  {
    accent: 'bg-ultramarine/15 text-ultramarine',
    icon: '📅',
    title: 'Sincronizados sempre',
    description:
      'Vejam em que episódio vocês pararam sem precisar perguntar "onde estamos mesmo?".',
  },
  {
    accent: 'bg-raspberry/15 text-raspberry',
    icon: '💌',
    title: 'Convide seu par',
    description: 'Crie um grupo e compartilhe um código de convite. Simples assim, sem cadastro complicado.',
  },
  {
    accent: 'bg-amber/15 text-amber',
    icon: '📊',
    title: 'Progresso visual',
    description: 'Barras de progresso por série e por temporada mostram o quanto já assistiram juntos.',
  },
  {
    accent: 'bg-flame/15 text-flame',
    icon: '🔔',
    title: 'Nunca percam o próximo',
    description: 'Marquem episódios assistidos em um toque e saibam sempre qual é o próximo.',
  },
];

const STEPS = [
  {
    color: 'bg-ultramarine',
    title: 'Crie sua conta',
    description: 'Cadastro rápido com e-mail e senha, sem enrolação.',
  },
  {
    color: 'bg-raspberry',
    title: 'Formem a dupla',
    description: 'Crie um grupo e envie o código de convite pro seu par.',
  },
  {
    color: 'bg-flame',
    title: 'Assistam juntos',
    description: 'Adicionem séries e marquem episódios conforme forem assistindo.',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAuthed = !isLoading && !!session;

  function goToApp() {
    navigate(isAuthed ? '/my-list' : '/login');
  }

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-surface-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Wordmark />

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#recursos" className="text-sm text-neutral-300 hover:text-white">
              Recursos
            </a>
            <a href="#como-funciona" className="text-sm text-neutral-300 hover:text-white">
              Como funciona
            </a>
            <Button onClick={goToApp} className="px-5 py-2.5 text-sm">
              {isAuthed ? 'Minha lista' : 'Entrar'}
            </Button>
          </nav>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          >
            <span
              className={`h-0.5 w-6 rounded-full bg-white transition-transform ${
                isMenuOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`h-0.5 w-6 rounded-full bg-white transition-opacity ${
                isMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`h-0.5 w-6 rounded-full bg-white transition-transform ${
                isMenuOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>

        {isMenuOpen && (
          <nav className="flex flex-col gap-1 border-t border-surface-border px-4 py-3 md:hidden">
            <a
              href="#recursos"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-neutral-300 hover:bg-surface-raised hover:text-white"
            >
              Recursos
            </a>
            <a
              href="#como-funciona"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-neutral-300 hover:bg-surface-raised hover:text-white"
            >
              Como funciona
            </a>
            <Button
              onClick={() => {
                setIsMenuOpen(false);
                goToApp();
              }}
              className="mt-2 w-full"
            >
              {isAuthed ? 'Minha lista' : 'Entrar'}
            </Button>
          </nav>
        )}
      </header>

      <main>
        <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-16 pb-14 text-center md:pt-24 md:pb-20">
          <span className="rounded-full border border-surface-border bg-surface-raised px-3 py-1 text-xs text-amber">
            Feito pra quem assiste séries a dois
          </span>

          <h1 className="mt-5 font-heading text-4xl font-semibold text-white md:text-5xl">
            Assistam suas séries.{' '}
            <span className="bg-gradient-to-r from-flame to-fuchsia bg-clip-text text-transparent">
              Sempre no mesmo episódio.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-neutral-400 md:text-lg">
            O WatchMate mantém você e seu par sincronizados: adicionem séries, marquem o que já
            assistiram e nunca mais percam o fio da história.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button onClick={goToApp} className="w-full sm:w-auto">
              {isAuthed ? 'Ir pra minha lista' : 'Começar agora'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto"
            >
              {isAuthed ? 'Ver conta' : 'Já tenho conta'}
            </Button>
          </div>

          <div className="mt-14 w-full max-w-md rounded-2xl border border-surface-border bg-surface-raised p-4">
            <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ultramarine text-xs font-semibold text-white">
                V
              </div>
              <div className="-ml-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia text-xs font-semibold text-white ring-2 ring-surface">
                ♥
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate font-heading text-sm font-semibold text-white">
                  Nome da Série
                </p>
                <p className="font-mono text-xs text-neutral-400">T2 · Ep 5 de 10</p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-flame text-sm text-white">
                ✓
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <div className="h-full w-3/5 rounded-full bg-flame" />
            </div>
          </div>
        </section>

        <section id="recursos" className="border-t border-surface-border bg-surface-raised/40">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center font-heading text-2xl font-semibold text-white md:text-3xl">
              Tudo pra assistir em dupla
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-surface-border bg-surface p-5"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${feature.accent}`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 font-heading text-base font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-neutral-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-t border-surface-border">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <h2 className="text-center font-heading text-2xl font-semibold text-white md:text-3xl">
              Como funciona
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.title} className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-heading font-semibold text-white ${step.color}`}
                  >
                    {index + 1}
                  </div>
                  <h3 className="mt-4 font-heading text-base font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 max-w-xs text-sm text-neutral-400">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-14 flex justify-center">
              <Button onClick={goToApp}>{isAuthed ? 'Ir pra minha lista' : 'Criar minha conta'}</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <Wordmark />
            <p className="mt-1 text-xs text-neutral-500">Feito pra quem assiste séries a dois.</p>
          </div>
          <p className="text-xs text-neutral-500">© 2026 WatchMate. Feito com 🍿</p>
        </div>
      </footer>
    </div>
  );
}
