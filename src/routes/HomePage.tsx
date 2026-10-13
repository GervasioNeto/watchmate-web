import { Link, useNavigate } from 'react-router-dom';
import { EyeOff } from 'lucide-react';
import { CoupleProgress } from '@/components/progress/CoupleProgress';
import { Wordmark } from '@/components/Wordmark';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import type { Person } from '@/lib/people';

// Dados de exemplo para a demonstração da página inicial.
const DEMO_ME: Person = {
  id: 'demo-me',
  role: 'me',
  name: 'Você',
  shortName: 'Você',
  initial: 'V',
};
const DEMO_PARTNER: Person = {
  id: 'demo-partner',
  role: 'partner',
  name: 'Rafa',
  shortName: 'Rafa',
  initial: 'R',
};

const POINTS = [
  {
    title: 'Cada um com o seu progresso',
    body: 'Marque o que você viu. Seu par sabe até onde você chegou, e o app mostra o que vocês têm em comum.',
  },
  {
    title: 'Viram juntos? Um toque marca os dois',
    body: 'No modo Juntos, marcar um episódio vale para a dupla. Dá para trocar para Cada um em qualquer série.',
  },
  {
    title: 'Sem spoiler entre vocês',
    body: 'Reações e comentários do seu par ficam escondidos até você assistir ao episódio.',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const isAuthed = !isLoading && !!session;

  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Wordmark />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(isAuthed ? '/my-list' : '/login')}
        >
          {isAuthed ? 'Minha lista' : 'Entrar'}
        </Button>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-20 px-4 pt-10 pb-20 md:pt-20">
        <section className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-5xl">
              A mesma série, cada um no seu ritmo.
            </h1>
            <p className="max-w-prose text-lg text-fg-muted">
              O WatchMate guarda até onde cada um de vocês assistiu, marca de uma vez o que viram
              juntos e esconde as reações do episódio que o outro ainda não viu.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => navigate(isAuthed ? '/my-list' : '/login')}>
                {isAuthed ? 'Ir para a minha lista' : 'Começar'}
              </Button>
              {!isAuthed && (
                <Link
                  to="/login"
                  className="px-2 text-sm font-semibold text-fg-muted hover:text-fg"
                >
                  Já tenho conta
                </Link>
              )}
            </div>
          </div>

          <figure className="flex flex-col gap-3">
            <figcaption className="flex items-baseline justify-between text-sm">
              <span className="font-bold">Arcane</span>
              <span className="text-fg-subtle">exemplo</span>
            </figcaption>
            <CoupleProgress
              rows={[
                { person: DEMO_ME, position: { temporada: 1, episodio: 4 }, percent: 44 },
                { person: DEMO_PARTNER, position: { temporada: 1, episodio: 2 }, percent: 22 },
              ]}
              common={{
                position: { temporada: 1, episodio: 2 },
                summary: 'Você está 2 episódios à frente.',
              }}
            >
              <p className="flex items-center gap-2 rounded-md border border-line px-3 py-2.5 text-sm text-fg-muted">
                <EyeOff size={15} aria-hidden className="shrink-0" />
                <span>Rafa reagiu ao T1 · E3. Assista para ver.</span>
              </p>
            </CoupleProgress>
          </figure>
        </section>

        <section aria-labelledby="how-heading" className="flex flex-col gap-8">
          <h2 id="how-heading" className="text-2xl font-extrabold tracking-tight">
            Feito para quem assiste a dois
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {POINTS.map((point) => (
              <div key={point.title} className="flex flex-col gap-2 border-t border-line pt-4">
                <h3 className="font-bold">{point.title}</h3>
                <p className="text-sm leading-relaxed text-fg-muted">{point.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-6">
          <Wordmark className="h-7" />
          <p className="text-xs text-fg-subtle">© 2026 WatchMate</p>
        </div>
      </footer>
    </div>
  );
}
