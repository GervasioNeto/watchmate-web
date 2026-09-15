import { useState } from 'react';
import { tmdbStillUrl } from '@/lib/tmdb';
import type { EpisodeProgress, SeasonEpisode } from '@/types/api';

interface EpisodeCardProps {
  episode: SeasonEpisode;
  progress: EpisodeProgress | undefined;
  markedByLabel: (marcadoPor: string | null) => string | null;
  onToggleWatched: () => void;
  isPending: boolean;
}

export function EpisodeCard({
  episode,
  progress,
  markedByLabel,
  onToggleWatched,
  isPending,
}: EpisodeCardProps) {
  const [expanded, setExpanded] = useState(false);

  const watched = !!progress?.assistidoEm;
  const label = watched ? markedByLabel(progress!.marcadoPor) : null;
  const stillUrl = tmdbStillUrl(episode.imagem);
  const date = episode.dataExibicao
    ? new Date(episode.dataExibicao).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;
  const metaLine = [date, episode.duracaoMinutos ? `${episode.duracaoMinutos}min` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="overflow-hidden rounded-2xl border border-surface-border bg-surface-raised">
      <div className="flex gap-3 p-3">
        <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-surface sm:w-36">
          {stillUrl ? (
            <img src={stillUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-heading text-lg font-semibold text-neutral-600">
              {episode.numero}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-neutral-500">Ep {episode.numero}</span>
            {watched && (
              <span className="rounded-full bg-flame/15 px-1.5 py-0.5 text-[10px] font-semibold text-flame">
                Assistido
              </span>
            )}
          </div>
          <h3 className="truncate font-heading text-sm font-semibold text-white">
            {episode.titulo}
          </h3>
          {metaLine && <p className="text-xs text-neutral-500">{metaLine}</p>}
          {label && <p className="text-[11px] text-neutral-500">{label}</p>}
        </div>

        <button
          type="button"
          onClick={onToggleWatched}
          disabled={isPending}
          aria-pressed={watched}
          aria-label={
            watched
              ? `Desmarcar episódio ${episode.numero}`
              : `Marcar episódio ${episode.numero} como assistido`
          }
          className={`flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border-2 transition-colors ${
            watched ? 'border-flame bg-flame text-white' : 'border-surface-border text-transparent'
          } disabled:opacity-50`}
        >
          ✓
        </button>
      </div>

      {episode.resumo && (
        <div className="border-t border-surface-border px-3 py-2.5">
          <p
            className={`text-xs leading-relaxed text-neutral-400 ${expanded ? '' : 'line-clamp-2'}`}
          >
            {episode.resumo}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-1.5 text-xs font-semibold text-flame hover:text-flame/80"
          >
            {expanded ? 'Recolher' : 'Ver mais'}
          </button>
        </div>
      )}
    </li>
  );
}
