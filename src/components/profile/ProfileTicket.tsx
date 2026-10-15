import { useId } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Pencil } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { pluralEpisodes } from '@/lib/coupleSummary';
import { cx } from '@/lib/cx';
import { formatMonth } from '@/lib/dates';
import type { Person } from '@/lib/people';
import { TONE_CLASSES, TONE_NAMES } from '@/lib/personTone';
import type { ProfileHighlights } from '@/lib/profileHighlights';
import { tmdbPosterUrl } from '@/lib/tmdb';
import type { TrackedSeries } from '@/types/api';

interface ProfileTicketProps {
  me: Person;
  partner: Person | null;
  memberSince: Date;
  // null enquanto o progresso das séries carrega.
  highlights: ProfileHighlights | null;
  isPickingAvatar: boolean;
  avatarPickerId: string;
  onToggleAvatarPicker: () => void;
}

// O topo do perfil é um ingresso: em cima, quem você é (avatar, nome e a sua cor na
// dupla); depois do picote, o canhoto com os seus números.
export function ProfileTicket({
  me,
  partner,
  memberSince,
  highlights,
  isPickingAvatar,
  avatarPickerId,
  onToggleAvatarPicker,
}: ProfileTicketProps) {
  const nameId = useId();
  const tone = TONE_CLASSES[me.tone];

  return (
    <section aria-labelledby={nameId} className="relative rounded-lg bg-surface">
      <div className="flex flex-col items-center gap-4 px-5 pt-8 pb-6 text-center">
        <div className="relative">
          <Avatar
            person={me}
            size="xl"
            className={cx('ring-4 ring-offset-4 ring-offset-surface', tone.ring)}
          />
          <button
            type="button"
            onClick={onToggleAvatarPicker}
            aria-expanded={isPickingAvatar}
            aria-controls={isPickingAvatar ? avatarPickerId : undefined}
            aria-label={isPickingAvatar ? 'Fechar a escolha de avatar' : 'Trocar avatar'}
            className="absolute -right-2 -bottom-2 flex h-9 w-9 items-center justify-center rounded-full bg-fg text-canvas ring-4 ring-surface transition-transform hover:scale-105"
          >
            {isPickingAvatar ? (
              <Check size={18} strokeWidth={2.5} aria-hidden />
            ) : (
              <Pencil size={15} strokeWidth={2.5} aria-hidden />
            )}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <h1
            id={nameId}
            className="text-2xl leading-tight font-extrabold tracking-tight text-balance"
          >
            {me.name}
          </h1>
          <p className="text-xs text-fg-subtle">No WatchMate desde {formatMonth(memberSince)}</p>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <p
            className={cx(
              'inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-2 text-xs font-semibold',
              tone.soft,
            )}
          >
            <span aria-hidden className={cx('h-2.5 w-2.5 rounded-full', tone.solid)} />
            {partner ? 'Sua cor na dupla' : 'Sua cor'}: {TONE_NAMES[me.tone]}
          </p>
          <p className="max-w-72 text-xs leading-relaxed text-fg-muted text-balance">
            {partner
              ? `É a cor do que você vê sem ${partner.shortName}, nas séries e no calendário. O que vocês veem juntos fica rosa.`
              : 'É a cor dos seus episódios nas séries e no calendário.'}
          </p>
        </div>
      </div>

      <Perforation />

      <div className="px-5 pt-6 pb-5">
        <TicketStub me={me} partner={partner} highlights={highlights} />
      </div>
    </section>
  );
}

// O picote do ingresso: a linha tracejada e um "dente" em cada borda. Os dentes são
// círculos na cor do fundo da página que passam metade para fora do cartão.
function Perforation() {
  return (
    <div aria-hidden className="relative h-0">
      <span className="absolute inset-x-6 -top-px border-t-2 border-dashed border-line" />
      <span className="absolute top-0 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-canvas" />
      <span className="absolute top-0 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-canvas" />
    </div>
  );
}

interface TicketStubProps {
  me: Person;
  partner: Person | null;
  highlights: ProfileHighlights | null;
}

// O canhoto: os seus números, quanto disso foi junto com o par e a série que você mais viu.
function TicketStub({ me, partner, highlights }: TicketStubProps) {
  if (!highlights) {
    return (
      <div className="flex flex-col gap-4" aria-label="Carregando os seus números">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="mx-auto h-14 w-24 rounded-md" />
          <Skeleton className="mx-auto h-14 w-24 rounded-md" />
        </div>
        <Skeleton className="h-2 rounded-full" />
      </div>
    );
  }

  if (highlights.watched === 0) {
    return (
      <p className="text-center text-sm text-fg-muted">
        Os seus números aparecem aqui quando você marcar o primeiro episódio.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-3 text-center">
        <Figure
          value={highlights.watched}
          label={highlights.watched === 1 ? 'episódio visto' : 'episódios vistos'}
        />
        <Figure
          value={highlights.finished}
          label={highlights.finished === 1 ? 'série terminada' : 'séries terminadas'}
        />
      </dl>

      {partner && <TogetherShare me={me} partner={partner} highlights={highlights} />}

      {highlights.topSeries && (
        <TopSeries series={highlights.topSeries.series} watched={highlights.topSeries.watched} />
      )}
    </div>
  );
}

// O rótulo vem antes no DOM (dt antes de dd), mas aparece embaixo do número.
function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col-reverse items-center gap-1">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="text-3xl leading-none font-extrabold tracking-tight tabular-nums">{value}</dd>
    </div>
  );
}

interface TogetherShareProps {
  me: Person;
  partner: Person;
  highlights: ProfileHighlights;
}

// Quanto do que você viu foi junto: a mesma barra das séries (rosa juntos, a sua cor o
// que você viu sem o par), com a porcentagem em destaque.
function TogetherShare({ me, partner, highlights }: TogetherShareProps) {
  const { watched, together } = highlights;
  const alone = watched - together;
  const share = Math.round((together / watched) * 100);

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm text-fg">
        <span className="font-extrabold tabular-nums">{share}%</span>{' '}
        <span className="text-fg-muted">do que você viu foi junto com {partner.shortName}</span>
      </p>
      <div aria-hidden className="flex h-2 gap-0.5">
        {together > 0 && (
          <span className="rounded-full bg-together" style={{ flexGrow: together }} />
        )}
        {alone > 0 && (
          <span
            className={cx('rounded-full', TONE_CLASSES[me.tone].solid)}
            style={{ flexGrow: alone }}
          />
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-together" />
          <span>
            <span className="font-semibold text-fg tabular-nums">{together}</span> juntos
          </span>
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className={cx('h-2 w-2 rounded-full', TONE_CLASSES[me.tone].solid)} />
          <span>
            <span className="font-semibold text-fg tabular-nums">{alone}</span> só você
          </span>
        </li>
      </ul>
    </div>
  );
}

// Atalho para a série que você mais viu, com o pôster.
function TopSeries({ series, watched }: { series: TrackedSeries; watched: number }) {
  const posterUrl = tmdbPosterUrl(series.posterPath, 'w185');
  return (
    <Link
      to={`/series/${series.id}`}
      className="group flex items-center gap-3 rounded-md bg-surface-2 p-2 pr-3 transition-colors hover:bg-line"
    >
      <span className="aspect-2/3 w-10 shrink-0 overflow-hidden rounded-sm bg-line">
        {posterUrl && <img src={posterUrl} alt="" className="h-full w-full object-cover" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs text-fg-subtle">A que você mais viu</span>
        <span className="truncate text-sm font-semibold text-fg">{series.nome}</span>
      </span>
      <span className="shrink-0 text-xs text-fg-muted tabular-nums">{pluralEpisodes(watched)}</span>
      <ChevronRight
        size={16}
        aria-hidden
        className="shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
      />
    </Link>
  );
}
