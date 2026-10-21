import type { ReactNode } from 'react';
import { Check, LoaderCircle, Plus } from 'lucide-react';
import { useAddSeries } from '@/hooks/useSeries';
import { cx } from '@/lib/cx';
import { tmdbPosterUrl } from '@/lib/tmdb';
import type { SeriesSearchResult } from '@/types/api';

interface PosterTileProps {
  series: SeriesSearchResult;
  // Já está na lista da dupla: o pôster apaga e ganha o "Na lista" no lugar do "+".
  isTracked: boolean;
  // Um selo no canto de cima (a posição no "Em alta", quantas duplas salvaram...).
  badge?: ReactNode;
  onOpen: () => void;
}

// Um pôster das estantes da busca. Tocar no pôster abre a prévia (sinopse, onde assistir);
// o "+" adiciona direto, sem sair da estante. São dois botões irmãos, um ao lado do outro.
export function PosterTile({ series, isTracked, badge, onOpen }: PosterTileProps) {
  const posterUrl = tmdbPosterUrl(series.posterPath, 'w342');
  const label = series.firstAirYear ? `${series.name}, ${series.firstAirYear}` : series.name;

  return (
    <div className="flex w-28 flex-col md:w-32">
      <div className="relative">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${label}. Ver detalhes`}
          className="group block aspect-2/3 w-full overflow-hidden rounded-md bg-surface ring-1 ring-line transition-transform active:scale-[0.97]"
        >
          {posterUrl ? (
            <img
              src={posterUrl}
              alt=""
              loading="lazy"
              className={cx(
                'h-full w-full object-cover transition-[opacity,scale] duration-200 group-hover:scale-[1.03]',
                isTracked && 'opacity-50',
              )}
            />
          ) : (
            <span className="flex h-full items-center justify-center p-2 text-center text-xs font-semibold text-fg-muted">
              {series.name}
            </span>
          )}
        </button>
        {badge}
        {isTracked ? <InListPill /> : <QuickAdd series={series} />}
      </div>

      <p aria-hidden className="mt-2 line-clamp-2 text-xs leading-snug font-semibold">
        {series.name}
      </p>
      {series.firstAirYear && (
        <p aria-hidden className="mt-0.5 text-[11px] text-fg-subtle tabular-nums">
          {series.firstAirYear}
        </p>
      )}
    </div>
  );
}

// Adiciona à lista sem abrir nada: o "+" gira enquanto salva e vira "Na lista" quando a
// lista da dupla recebe a série. Se der erro, ganha o anel vermelho e tenta de novo no toque.
function QuickAdd({ series }: { series: SeriesSearchResult }) {
  const add = useAddSeries();
  return (
    <button
      type="button"
      onClick={() => add.mutate(series.tmdbId)}
      disabled={add.isPending}
      aria-label={`Adicionar ${series.name} à lista`}
      title={
        add.isError ? 'Não deu para adicionar. Toque para tentar de novo.' : 'Adicionar à lista'
      }
      className={cx(
        'absolute right-1.5 bottom-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-scrim text-fg ring-1 ring-fg/15 backdrop-blur-sm transition-[scale,background-color] hover:bg-canvas active:scale-90 disabled:cursor-progress',
        add.isError && 'ring-2 ring-danger',
      )}
    >
      {add.isPending ? (
        <LoaderCircle size={16} aria-hidden className="animate-spin" />
      ) : (
        <Plus size={18} strokeWidth={2.5} aria-hidden />
      )}
    </button>
  );
}

function InListPill() {
  return (
    <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-fg py-0.5 pr-2 pl-1.5 text-[11px] font-bold text-canvas">
      <Check size={12} strokeWidth={3} aria-hidden />
      Na lista
    </span>
  );
}

// A posição no "Em alta", como o número de um ingresso: "01", "02"... As três primeiras no
// laranja da marca.
export function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="absolute top-0 left-0 rounded-tl-md rounded-br-md bg-canvas/85 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums backdrop-blur-sm">
      <span aria-hidden className={rank <= 3 ? 'text-accent' : 'text-fg'}>
        {String(rank).padStart(2, '0')}
      </span>
      <span className="sr-only">Número {rank} em alta</span>
    </span>
  );
}

// Quantas duplas do WatchMate salvaram: os dois círculos da aba Dupla e o número.
export function CouplesBadge({ count }: { count: number }) {
  return (
    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-scrim py-0.5 pr-2 pl-1.5 text-[11px] font-bold text-fg tabular-nums backdrop-blur-sm">
      <svg viewBox="0 0 20 12" width="16" height="10" aria-hidden className="shrink-0">
        <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="14" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <span aria-hidden>{count}</span>
      <span className="sr-only">{count} duplas salvaram</span>
    </span>
  );
}
