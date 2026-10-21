import { useId } from 'react';
import { History } from 'lucide-react';
import { useRecentSearches } from '@/hooks/useRecentSearches';

// As últimas buscas deste aparelho, para repetir com um toque. Some quando não há nenhuma.
export function RecentSearches({ onPick }: { onPick: (query: string) => void }) {
  const { searches, clear } = useRecentSearches();
  const titleId = useId();
  if (searches.length === 0) return null;

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <h3 id={titleId} className="text-sm font-semibold text-fg-muted">
          Buscas recentes
        </h3>
        <button
          type="button"
          onClick={clear}
          className="rounded-sm text-xs font-semibold text-fg-subtle hover:text-fg"
        >
          Limpar
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {searches.map((query) => (
          <li key={query}>
            <button
              type="button"
              onClick={() => onPick(query)}
              className="inline-flex min-h-8 max-w-56 items-center gap-1.5 rounded-full bg-surface-2 py-1 pr-3 pl-2.5 text-sm text-fg transition-colors hover:bg-line"
            >
              <History size={14} aria-hidden className="shrink-0 text-fg-subtle" />
              <span className="truncate">{query}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
