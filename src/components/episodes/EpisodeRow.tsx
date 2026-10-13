import { useId, useState } from 'react';
import { Check, ChevronDown, Ellipsis, LoaderCircle } from 'lucide-react';
import { EpisodeComments } from '@/components/episodes/EpisodeComments';
import { EpisodeReactions } from '@/components/episodes/EpisodeReactions';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { IconButton } from '@/components/ui/IconButton';
import { cx } from '@/lib/cx';
import type { ProgressChoice, QuickToggle } from '@/lib/episodeActions';
import type { EpisodeWatchStatus } from '@/lib/progress';
import { formatEpisodeCode } from '@/lib/progress';
import { tmdbStillUrl } from '@/lib/tmdb';
import type { ProgressScope, SeasonEpisode } from '@/types/api';

interface EpisodeRowProps {
  seriesId: string;
  season: number;
  number: number;
  // Dados do TMDB; ausentes quando a busca da temporada falha.
  details?: SeasonEpisode;
  status: EpisodeWatchStatus;
  toggle: QuickToggle;
  choices: ProgressChoice[];
  partnerName: string | null;
  // Episódios que entraram no TMDB depois que a série foi adicionada não podem ser marcados.
  canMark: boolean;
  isPending: boolean;
  onChange: (change: { watched: boolean; scope: ProgressScope }) => void;
}

function formatAirDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function WatchedBy({ status, partnerName }: Pick<EpisodeRowProps, 'status' | 'partnerName'>) {
  if (!partnerName) return null;
  const { me, partner } = status;
  if (me && partner) {
    const together = me.juntos && partner.juntos;
    return (
      <span className="flex items-center gap-1.5 text-xs text-fg-muted">
        {together && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-together" />}
        {together ? 'Vocês viram juntos' : 'Os dois viram'}
      </span>
    );
  }
  if (me) return <span className="text-xs font-semibold text-me">Só você viu</span>;
  if (partner) {
    return <span className="text-xs font-semibold text-partner">Só {partnerName} viu</span>;
  }
  return null;
}

export function EpisodeRow({
  seriesId,
  season,
  number,
  details,
  status,
  toggle,
  choices,
  partnerName,
  canMark,
  isPending,
  onChange,
}: EpisodeRowProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const code = formatEpisodeCode({ temporada: season, episodio: number });

  const stillUrl = tmdbStillUrl(details?.imagem ?? null);
  const metaLine = [
    formatAirDate(details?.dataExibicao ?? null),
    details?.duracaoMinutos ? `${details.duracaoMinutos} min` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const toggleLabel = toggle.watched
    ? `Marcar ${code} como visto${toggle.scope === 'both' ? ' pelos dois' : ''}`
    : `Desmarcar ${code}${toggle.scope === 'both' ? ' para os dois' : ''}`;
  const checkedTone =
    toggle.scope === 'both' ? 'bg-together text-on-together' : 'bg-me text-canvas';
  // Desmarcado, mas uma das pessoas já viu: a borda ganha a cor de quem viu.
  const uncheckedTone =
    status.me && !status.partner
      ? 'border-2 border-me'
      : status.partner && !status.me
        ? 'border-2 border-partner'
        : 'border-2 border-line';

  return (
    <li className="border-b border-line py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-sm bg-surface sm:w-32">
          {stillUrl ? (
            <img src={stillUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-fg-subtle">
              E{number}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={expanded ? detailsId : undefined}
          className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
        >
          <span className="text-xs font-semibold text-fg-subtle tabular-nums">{code}</span>
          <span className="line-clamp-2 text-sm font-semibold">
            {details?.titulo ?? `Episódio ${number}`}
          </span>
          {metaLine && <span className="text-xs text-fg-subtle">{metaLine}</span>}
          <WatchedBy status={status} partnerName={partnerName} />
          <span className="mt-0.5 flex items-center gap-1 text-xs text-fg-muted">
            {expanded ? 'Fechar' : 'Detalhes'}
            <ChevronDown
              size={14}
              aria-hidden
              className={cx('transition-transform', expanded && 'rotate-180')}
            />
          </span>
        </button>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => onChange({ watched: toggle.watched, scope: toggle.scope })}
            disabled={!canMark || isPending}
            aria-pressed={toggle.checked}
            aria-label={toggleLabel}
            className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              className={cx(
                'flex h-7 w-7 items-center justify-center rounded-full',
                toggle.checked ? checkedTone : uncheckedTone,
              )}
            >
              {isPending ? (
                <LoaderCircle size={15} className="animate-spin text-fg" aria-hidden />
              ) : (
                toggle.checked && <Check size={16} strokeWidth={3} aria-hidden />
              )}
            </span>
          </button>

          {choices.length > 0 && (
            <ActionSheet
              title={details?.titulo ? `${code} · ${details.titulo}` : code}
              items={choices.map((choice) => ({
                key: `${choice.scope}-${choice.watched}`,
                label: choice.label,
                destructive: choice.destructive,
                onSelect: () => onChange({ watched: choice.watched, scope: choice.scope }),
              }))}
              renderTrigger={(triggerProps) => (
                <IconButton
                  {...triggerProps}
                  aria-label={`Mais opções do ${code}`}
                  disabled={!canMark || isPending}
                >
                  <Ellipsis size={18} />
                </IconButton>
              )}
            />
          )}
        </div>
      </div>

      {!canMark && (
        <p className="mt-2 text-xs text-fg-subtle">
          Esse episódio saiu depois que a série foi adicionada e ainda não pode ser marcado.
        </p>
      )}

      {expanded && (
        <div id={detailsId} className="mt-3 flex flex-col gap-5 rounded-md bg-surface p-3">
          {details?.resumo && (
            <p className="text-sm leading-relaxed text-fg-muted">{details.resumo}</p>
          )}
          <EpisodeReactions seriesId={seriesId} season={season} episode={number} enabled />
          <EpisodeComments seriesId={seriesId} season={season} episode={number} enabled />
        </div>
      )}
    </li>
  );
}
