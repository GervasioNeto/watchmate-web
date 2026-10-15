import { useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Play, Sofa } from 'lucide-react';
import { CoupleAvatars } from '@/components/couple/CoupleAvatars';
import { Avatar } from '@/components/ui/Avatar';
import { useCouple } from '@/hooks/useCouple';
import type { TonightPick } from '@/lib/listOrder';
import { subjectName } from '@/lib/people';
import { formatEpisodeCode, getMember } from '@/lib/progress';
import { tmdbBackdropUrl, tmdbPosterUrl } from '@/lib/tmdb';

// Atalho para a série de hoje (ver pickTonight). Quando vocês estão no mesmo ponto, é o
// "Hoje no sofá": um convite para o próximo episódio juntos. Senão, "Continuar
// assistindo": onde cada um está e o seu próximo. Não marca nada: marcar fica na página
// da série, onde dá para ver o que cada um já viu antes de decidir.
export function ContinueWatchingCard({ pick }: { pick: TonightPick }) {
  const { me, partner } = useCouple();
  const headingId = useId();

  if (!me) return null;

  const { series, progress } = pick.entry;
  const next = formatEpisodeCode(pick.status.position);
  const isNew = pick.status.kind === 'new-episode';
  const isTogether = pick.together && partner;
  const posterUrl = tmdbPosterUrl(series.posterPath, 'w185');
  const backdropUrl = tmdbBackdropUrl(series.backdropPath);

  let details: ReactNode;
  let callToAction: ReactNode;
  if (isTogether) {
    const common = progress.emComum.posicaoAtual;
    details = (
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <CoupleAvatars me={me} partner={partner} size="sm" />
        {common ? `Vocês dois pararam no ${formatEpisodeCode(common)}` : 'Vocês dois juntos'}
      </p>
    );
    callToAction = isNew ? (
      <>
        <span className="text-accent">Saiu o {next}.</span> Bora?
      </>
    ) : (
      `Bora o ${next}?`
    );
  } else {
    const people = [me, partner].filter((person) => person !== null);
    details = (
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
        {people.map((person) => {
          const position = getMember(progress, person.id)?.posicaoAtual ?? null;
          return (
            <li key={person.id} className="flex items-center gap-1.5">
              <Avatar person={person} size="xs" />
              {subjectName(person)}
              <span className="tabular-nums">
                {position ? formatEpisodeCode(position) : 'não começou'}
              </span>
            </li>
          );
        })}
      </ul>
    );
    callToAction = isNew ? (
      <>
        <span className="text-accent">Novo:</span> {next}
      </>
    ) : (
      `Próximo: ${next}`
    );
  }

  return (
    // O link do nome cobre o card inteiro (after:inset-0); o contorno de foco vai no card.
    <section
      aria-labelledby={headingId}
      className="group relative isolate overflow-hidden rounded-lg bg-surface has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent"
    >
      {backdropUrl && (
        <>
          <img
            src={backdropUrl}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-r from-surface via-surface/85 to-surface/40"
          />
        </>
      )}

      <div className="flex flex-col gap-3 py-4 pr-12 pl-4">
        <h2
          id={headingId}
          className="flex items-center gap-1.5 text-xs font-semibold text-fg-muted"
        >
          {isTogether ? (
            <>
              <Sofa size={13} aria-hidden className="text-together" />
              Hoje no sofá
            </>
          ) : (
            <>
              <Play size={11} aria-hidden className="fill-current" />
              Continuar assistindo
            </>
          )}
        </h2>

        <div className="flex items-center gap-4">
          <div className="aspect-2/3 w-16 shrink-0 overflow-hidden rounded-sm bg-surface-2">
            {posterUrl && <img src={posterUrl} alt="" className="h-full w-full object-cover" />}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Link
              to={`/series/${series.id}`}
              className="line-clamp-2 text-lg leading-tight font-bold after:absolute after:inset-0 focus-visible:outline-none"
            >
              {series.nome}
            </Link>
            {details}
            <p className="text-sm font-semibold tabular-nums">{callToAction}</p>
          </div>
        </div>
      </div>

      {/* Centralizada no card inteiro. Sem pointer-events: o toque nela cai no link. */}
      <ChevronRight
        size={26}
        strokeWidth={2.5}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-fg-muted transition group-hover:translate-x-0.5 group-hover:text-fg"
      />
    </section>
  );
}
