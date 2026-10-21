import { useId } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Pencil } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { TicketPerforation } from '@/components/ui/TicketPerforation';
import { pluralEpisodes } from '@/lib/coupleSummary';
import { cx } from '@/lib/cx';
import { formatMonth } from '@/lib/dates';
import type { Person } from '@/lib/people';
import { TONE_CLASSES, toneName } from '@/lib/personTone';
import type { ProfileHighlights } from '@/lib/profileHighlights';
import { tmdbPosterUrl } from '@/lib/tmdb';
import type { TrackedSeries } from '@/types/api';

// O que o ingresso deixa trocar, cada um na sua folha (modal): o avatar e a cor.
export type ProfileEditor = 'avatar' | 'color';

interface ProfileTicketProps {
  me: Person;
  partner: Person | null;
  memberSince: Date;
  // null enquanto o progresso das séries carrega.
  highlights: ProfileHighlights | null;
  // A folha aberta agora, para os botões dizerem que estão abertos (aria-expanded).
  openEditor: ProfileEditor | null;
  // Abre a folha; o botão que abriu recebe o foco de volta quando ela fechar.
  onOpenEditor: (editor: ProfileEditor, trigger: HTMLElement) => void;
}

// O topo do perfil é um ingresso: em cima, quem você é (avatar, nome e a sua cor na
// dupla); depois do picote, o canhoto com os seus números.
export function ProfileTicket({
  me,
  partner,
  memberSince,
  highlights,
  openEditor,
  onOpenEditor,
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
            onClick={(event) => onOpenEditor('avatar', event.currentTarget)}
            aria-haspopup="dialog"
            aria-expanded={openEditor === 'avatar'}
            aria-label="Trocar avatar"
            className="absolute -right-2 -bottom-2 flex h-9 w-9 items-center justify-center rounded-full bg-fg text-canvas ring-4 ring-surface transition-transform hover:scale-105"
          >
            <Pencil size={15} strokeWidth={2.5} aria-hidden />
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
          {/* O selo abre a escolha de cor: é aqui que a pessoa descobre que pode trocar. */}
          <button
            type="button"
            onClick={(event) => onOpenEditor('color', event.currentTarget)}
            aria-haspopup="dialog"
            aria-expanded={openEditor === 'color'}
            className={cx(
              'inline-flex min-h-8 items-center gap-2 rounded-full py-1 pr-2.5 pl-2 text-xs font-semibold transition-[filter] hover:brightness-125',
              tone.soft,
            )}
          >
            <span aria-hidden className={cx('h-2.5 w-2.5 rounded-full', tone.solid)} />
            {partner ? 'Sua cor na dupla' : 'Sua cor'}: {toneName(me.tone)}
            <Pencil size={12} strokeWidth={2.5} aria-hidden className="opacity-80" />
          </button>
          <p className="max-w-72 text-xs leading-relaxed text-balance text-fg-muted">
            {partner
              ? `É a cor do que você vê sem ${partner.shortName}, nas séries e no calendário. O que vocês veem juntos fica no laranja do WatchMate.`
              : 'É a cor dos seus episódios nas séries e no calendário.'}
          </p>
        </div>
      </div>

      <TicketPerforation />

      <div className="px-5 pt-6 pb-5">
        <TicketStub me={me} partner={partner} highlights={highlights} />
      </div>
    </section>
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

// Quanto do que você viu foi junto: a mesma barra das séries (laranja juntos, a sua cor o
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
