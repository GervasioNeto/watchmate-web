import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { GiftBox } from '@/components/gifts/GiftBox';
import { InviteStamp } from '@/components/invite/InviteStamp';
import { Avatar } from '@/components/ui/Avatar';
import { cx } from '@/lib/cx';
import { formatTimeAgo } from '@/lib/dates';
import { formatOpening, occasionOf, wrapOf } from '@/lib/gifts';
import { inboxDestination } from '@/lib/inbox';
import { describeInviteTime, getTicketState } from '@/lib/invites';
import type { Person } from '@/lib/people';
import { formatEpisodeCode } from '@/lib/progress';
import { tmdbPosterUrl } from '@/lib/tmdb';
import type { InboxGift, InboxItem } from '@/types/api';

// Trancado agora (a lista pode ter vindo antes de a hora chegar).
function isLockedGift(gift: InboxGift, now: Date): boolean {
  return new Date(gift.opensAt) > now;
}

interface InboxItemRowProps {
  item: InboxItem;
  actor: Person | null;
  now: Date;
  // Chegou por um aviso deste item: ele acende por um instante.
  highlight?: boolean;
}

// Uma linha de "Entre vocês": quem fez (o avatar, com um selinho do tipo), a frase, o que
// tem dentro (o comentário, o recado, o convite) e, à direita, o pôster da série. O que é
// novo fica com o fundo aceso e o pontinho laranja ao lado da hora.
export function InboxItemRow({ item, actor, now, highlight = false }: InboxItemRowProps) {
  const posterUrl = item.series ? tmdbPosterUrl(item.series.posterPath, 'w185') : null;
  const name = actor?.shortName ?? 'Seu par';

  return (
    <li data-highlight={highlight || undefined}>
      <Link
        to={inboxDestination(item)}
        className={cx(
          'group -mx-3 flex gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-surface',
          item.isNew && 'bg-surface',
          highlight && 'animate-spotlight',
        )}
      >
        <span className="relative h-fit shrink-0">
          <Avatar person={actor} size="md" />
          <span
            aria-hidden
            className="absolute -right-1.5 -bottom-1 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-surface-2 text-[11px] leading-none ring-2 ring-canvas group-hover:ring-surface"
          >
            {badgeOf(item)}
          </span>
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-sm leading-snug text-fg-muted">
            <strong className="font-semibold text-fg">{name}</strong>{' '}
            <Sentence item={item} now={now} />
          </span>
          <Preview item={item} now={now} />
          <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
            {item.isNew && (
              <>
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="sr-only">Novo.</span>
              </>
            )}
            {formatTimeAgo(new Date(item.at), now)}
          </span>
        </span>

        {posterUrl && (
          <span className="aspect-2/3 w-10 shrink-0 self-start overflow-hidden rounded-sm bg-surface-2 ring-1 ring-line">
            <img src={posterUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          </span>
        )}
      </Link>
    </li>
  );
}

// O selinho no avatar: a mesma figura do push de cada tipo.
function badgeOf(item: InboxItem): string {
  switch (item.type) {
    case 'invite':
      return '🍿';
    case 'invite-answer':
      if (item.invite?.status === 'declined') return '😴';
      return item.invite?.rescheduled ? '⏰' : '🛋️';
    case 'note':
      return '💌';
    case 'comment':
      return item.hidden ? '🙈' : '💬';
    case 'reaction':
      return item.hidden ? '🙈' : (item.emoji ?? '❤️');
    case 'episode-watched':
    case 'season-finished':
      return '👀';
    case 'series-added':
      return '✨';
    case 'gift':
      return '🎁';
    case 'gift-opened':
      return item.emoji ?? '🥹';
    case 'voucher-used':
      return '🎟️';
  }
}

function SeriesName({ item }: { item: InboxItem }) {
  return <strong className="font-semibold text-fg">{item.series?.nome ?? 'uma série'}</strong>;
}

function episodeOf(item: InboxItem): string {
  return item.season && item.episode
    ? formatEpisodeCode({ temporada: item.season, episodio: item.episode })
    : 'episódio';
}

// O resto da frase, depois do nome de quem fez.
function Sentence({ item, now }: { item: InboxItem; now: Date }): ReactNode {
  const series = <SeriesName item={item} />;
  const episode = episodeOf(item);

  switch (item.type) {
    case 'invite':
      return <>te chamou pro sofá pra ver {series}</>;
    case 'invite-answer': {
      const invite = item.invite;
      if (invite?.status === 'declined') return <>não vai conseguir ver {series} hoje</>;
      if (invite?.rescheduled) {
        return (
          <>
            topou ver {series}, mas {describeInviteTime(invite.at, now)}
          </>
        );
      }
      return <>topou ver {series}!</>;
    }
    case 'note':
      return <>deixou um recado pra você</>;
    case 'comment':
      return item.count > 1 ? (
        <>
          comentou {item.count} vezes no {episode} de {series}
        </>
      ) : (
        <>
          comentou o {episode} de {series}
        </>
      );
    case 'reaction':
      return item.emoji ? (
        <>
          reagiu com {item.emoji} ao {episode} de {series}
        </>
      ) : (
        <>
          reagiu ao {episode} de {series}
        </>
      );
    case 'episode-watched':
      return item.count > 1 ? (
        <>
          viu {item.count} episódios de {series}, até o {episode}
        </>
      ) : (
        <>
          viu o {episode} de {series}
        </>
      );
    case 'season-finished':
      return (
        <>
          terminou a temporada {item.season} de {series}
        </>
      );
    case 'series-added':
      return <>adicionou {series} à lista de vocês</>;
    case 'gift':
      if (item.gift && isLockedGift(item.gift, now)) {
        return (
          <>
            deixou um presente pra você. Abre {formatOpening(new Date(item.gift.opensAt), now)} 🔒
          </>
        );
      }
      return item.gift?.openedAt ? <>te deu um presente</> : <>deixou um presente pra você 💝</>;
    case 'gift-opened':
      return item.emoji ? (
        <>abriu seu presente e reagiu com {item.emoji}</>
      ) : (
        <>abriu seu presente</>
      );
    case 'voucher-used':
      return <>quer usar um vale do seu presente. Hora de cumprir!</>;
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// O que vai dentro da linha, quando tem: o texto, o spoiler escondido ou o canhoto do convite.
function Preview({ item, now }: { item: InboxItem; now: Date }) {
  // O presente: a caixinha no embrulho dele e o título da ocasião (o que tem dentro só
  // aparece ao abrir).
  if ((item.type === 'gift' || item.type === 'gift-opened') && item.gift) {
    return (
      <span className="flex items-center gap-2.5 self-start rounded-md bg-surface-2 py-1.5 pr-3 pl-1.5">
        <GiftBox
          wrap={wrapOf(item.gift.wrap)}
          lock={item.type === 'gift' && isLockedGift(item.gift, now) ? 'locked' : undefined}
          size={32}
        />
        <span className="text-xs font-semibold text-fg">
          {occasionOf(item.gift.occasion).headline}
        </span>
        {item.type === 'gift' &&
          !item.gift.openedAt &&
          (isLockedGift(item.gift, now) ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-fg/10 px-2 py-0.5 text-[11px] font-bold">
              <LockKeyhole size={11} strokeWidth={2.75} aria-hidden />
              Trancado
            </span>
          ) : (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-on-accent">
              Abrir
            </span>
          ))}
      </span>
    );
  }

  if (item.type === 'voucher-used' && item.text) {
    return (
      <span className="flex items-center gap-2 self-start rounded-md border border-dashed border-line py-1.5 pr-3 pl-2.5 text-xs">
        <span aria-hidden className="text-base leading-none">
          {item.emoji ?? '🎟️'}
        </span>
        <span>
          <span className="font-black tracking-[0.14em] text-fg-subtle uppercase">Vale </span>
          <span className="font-semibold text-fg">{item.text}</span>
        </span>
      </span>
    );
  }

  if (item.type === 'note' && item.text) {
    return (
      <span className="self-start rounded-lg rounded-tl-sm bg-note px-3 py-2 text-sm leading-snug font-semibold wrap-break-word text-on-note">
        {item.text}
      </span>
    );
  }

  if (item.type === 'comment' || item.type === 'reaction') {
    if (item.hidden) {
      return (
        <span className="self-start rounded-lg rounded-tl-sm bg-surface-2 px-3 py-2 text-xs font-semibold text-fg-muted">
          🙈 Assista o episódio para ver
        </span>
      );
    }
    if (item.type === 'comment' && item.text) {
      return (
        <span className="line-clamp-3 self-start rounded-lg rounded-tl-sm bg-surface-2 px-3 py-2 text-sm leading-snug wrap-break-word text-fg">
          {item.text}
        </span>
      );
    }
    return null;
  }

  if ((item.type === 'invite' || item.type === 'invite-answer') && item.invite) {
    const invite = item.invite;
    // O estado visto por quem recebeu o convite (quem está olhando esta linha, num "invite").
    const state = getTicketState(invite, invite.toId);
    return (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2 self-start rounded-md border border-dashed border-line py-1.5 pr-2 pl-2.5">
        <span className="text-xs whitespace-nowrap">
          <span className="font-semibold text-fg tabular-nums">
            {formatEpisodeCode({ temporada: invite.season, episodio: invite.episode })}
          </span>
          <span className="text-fg-muted"> · {capitalize(describeInviteTime(invite.at, now))}</span>
        </span>
        <InviteStamp state={state} size="sm" />
      </span>
    );
  }

  return null;
}
