import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { SeasonTrack } from '@/components/series/SeasonTrack';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouple } from '@/hooks/useCouple';
import { useSetInterest } from '@/hooks/useSeries';
import { pluralEpisodes } from '@/lib/coupleSummary';
import { cx } from '@/lib/cx';
import { formatUpcomingDay } from '@/lib/dates';
import type { CoupleInterest } from '@/lib/interest';
import { subjectName, type Person } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';
import { formatEpisodeCode } from '@/lib/progress';
import { describeSeriesCard, type CardStatus } from '@/lib/seriesCard';
import { tmdbPosterUrl } from '@/lib/tmdb';
import type { EpisodePosition, SeriesProgress, TrackedSeries } from '@/types/api';

interface SeriesCardProps {
  series: TrackedSeries;
  progress: SeriesProgress | undefined;
  // Aceso pela roleta do sorteio.
  highlighted?: boolean;
}

// Base dos selos no canto de cima do pôster.
const POSTER_PILL =
  'absolute top-1.5 left-1.5 inline-flex h-6 items-center gap-1 rounded-full text-xs font-bold ring-2 ring-canvas';

// Pôster, a temporada em contas nas cores da dupla e, embaixo do título, o que vem a
// seguir para você. Nos cantos do pôster: quem está à frente (ou quem quer ver), episódio
// novo, o emoji da série e, na fila, o seu "quero ver".
//
// O link é o título, esticado sobre o card inteiro (after:inset-0): assim o botão de
// "quero ver" fica fora dele (botão dentro de link não é permitido) e o leitor de tela
// anuncia o link só pelo nome da série.
export function SeriesCard({ series, progress, highlighted = false }: SeriesCardProps) {
  const { me, partner } = useCouple();
  const posterUrl = tmdbPosterUrl(series.posterPath, 'w342');
  const now = new Date();
  const card = me && progress ? describeSeriesCard(series, progress, me, partner, now) : null;

  return (
    <article className="group relative flex flex-col rounded-md has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-accent">
      <div
        className={cx(
          'relative aspect-2/3 overflow-hidden rounded-md bg-surface transition-[scale,box-shadow] duration-150',
          highlighted && 'scale-[1.03] ring-2 ring-together ring-offset-2 ring-offset-canvas',
        )}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-opacity group-hover:opacity-85"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-full w-full items-center justify-center p-3 text-center text-sm font-semibold text-fg-muted"
          >
            {series.nome}
          </span>
        )}

        {card?.ahead && <AheadBadge person={card.ahead.person} count={card.ahead.count} />}
        {card?.interest && partner && <InterestBadge interest={card.interest} partner={partner} />}
        {card?.status.kind === 'new-episode' && (
          // O mesmo pontinho do recado novo: tem novidade aqui.
          <span
            aria-hidden
            className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-canvas"
          />
        )}
        {series.emojiDaSerie && <EmojiSticker emoji={series.emojiDaSerie} />}
        {card?.interest && me && (
          <InterestButton
            seriesId={series.id}
            seriesName={series.nome}
            me={me}
            wants={card.interest.mine}
          />
        )}
      </div>

      {/* Mesma altura com ou sem trilha: os títulos de uma linha da grade ficam alinhados. */}
      <div className="mt-2 h-1.5">
        {card === null ? (
          <Skeleton className="h-full rounded-full" />
        ) : (
          me && card.track && <SeasonTrack track={card.track} me={me} partner={partner} />
        )}
      </div>

      <Link
        to={`/series/${series.id}`}
        className="mt-2 line-clamp-2 text-sm leading-snug font-semibold wrap-break-word after:absolute after:inset-0 after:rounded-md focus-visible:outline-none"
      >
        {series.nome}
      </Link>
      {card ? (
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-fg-muted">
          {statusContent(card.status, now)}
        </p>
      ) : (
        <Skeleton className="mt-1.5 h-3 w-2/3 rounded-sm" />
      )}
    </article>
  );
}

// O avatar de quem está à frente e por quantos episódios, na cor da pessoa.
function AheadBadge({ person, count }: { person: Person; count: number }) {
  const description = `${subjectName(person)} está ${pluralEpisodes(count)} à frente`;
  return (
    <span
      title={description}
      className={cx(POSTER_PILL, 'py-0.5 pr-2 pl-0.5 tabular-nums', TONE_CLASSES[person.tone].soft)}
    >
      <Avatar person={person} size="xs" />
      <span aria-hidden>+{count}</span>
      <span className="sr-only">{description}.</span>
    </span>
  );
}

// Quem quer ver, do ponto de vista do par: rosa quando são os dois, a cor do par quando é
// só ele. O seu "quero ver" já aparece no coração do botão, então sozinho não ganha selo.
function InterestBadge({ interest, partner }: { interest: CoupleInterest; partner: Person }) {
  if (interest.mine && interest.partner) {
    return (
      <span className={cx(POSTER_PILL, 'bg-together px-2 text-on-together')}>
        <Heart size={12} strokeWidth={2.5} aria-hidden className="fill-current" />
        <span aria-hidden>Os dois</span>
        <span className="sr-only">Vocês dois querem ver.</span>
      </span>
    );
  }
  if (!interest.partner) return null;
  return (
    <span className={cx(POSTER_PILL, 'py-0.5 pr-2 pl-0.5', TONE_CLASSES[partner.tone].soft)}>
      <Avatar person={partner} size="xs" />
      <Heart size={12} strokeWidth={2.5} aria-hidden className="fill-current" />
      <span className="sr-only">{partner.shortName} quer ver.</span>
    </span>
  );
}

interface InterestButtonProps {
  seriesId: string;
  seriesName: string;
  me: Person;
  wants: boolean;
}

// O seu "quero ver": coração vazado, ou cheio na sua cor quando marcado. Fica acima do
// link esticado (z-10), então o toque nele não abre a série.
function InterestButton({ seriesId, seriesName, me, wants }: InterestButtonProps) {
  const setInterest = useSetInterest(seriesId, me.id);
  return (
    <button
      type="button"
      aria-pressed={wants}
      aria-label={`Quero ver ${seriesName}`}
      title={wants ? 'Você quer ver' : 'Quero ver'}
      onClick={() => setInterest.mutate(!wants)}
      className="absolute right-1.5 bottom-1.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-scrim text-fg transition-transform active:scale-90"
    >
      <Heart
        size={18}
        strokeWidth={2.25}
        aria-hidden
        className={cx(wants && cx('fill-current', TONE_CLASSES[me.tone].text))}
      />
    </button>
  );
}

// O emoji que vocês mais usaram na série, colado no pôster como um adesivo.
function EmojiSticker({ emoji }: { emoji: string }) {
  return (
    <span className="absolute bottom-1.5 left-1.5 -rotate-8 text-2xl leading-none drop-shadow-md select-none">
      <span aria-hidden>{emoji}</span>
      <span className="sr-only">A reação que vocês mais usaram: {emoji}.</span>
    </span>
  );
}

function statusContent(status: CardStatus, now: Date): ReactNode {
  const truncated = (content: ReactNode) => <span className="min-w-0 truncate">{content}</span>;
  const episode = (position: EpisodePosition) => (
    <span className="font-semibold text-fg tabular-nums">{formatEpisodeCode(position)}</span>
  );

  switch (status.kind) {
    case 'next':
      return truncated(<>Próximo: {episode(status.position)}</>);
    case 'new-episode':
      return truncated(
        <>
          <span className="font-semibold text-accent">Novo:</span> {episode(status.position)}
        </>,
      );
    case 'upcoming':
      return truncated(`Próximo sai ${formatUpcomingDay(status.date, now)}`);
    case 'caught-up':
      return truncated('Em dia');
    case 'finished':
      return truncated(status.together ? 'Vocês terminaram' : 'Você terminou');
    case 'premiere':
      return truncated(`Estreia ${formatUpcomingDay(status.date, now)}`);
    case 'idea':
      return (
        <>
          <Avatar person={status.person} size="xs" />
          {truncated(
            status.person.role === 'me' ? 'Sua ideia' : `Ideia de ${status.person.shortName}`,
          )}
        </>
      );
    case 'not-started':
      return truncated('Para começar');
  }
}
