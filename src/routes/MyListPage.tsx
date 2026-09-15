import { Navigate, useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { SeriesCard } from '@/components/SeriesCard';
import { Button } from '@/components/Button';
import { useMe } from '@/hooks/useMe';
import { useGroup } from '@/hooks/useGroup';
import { useSeries } from '@/hooks/useSeries';

export function MyListPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: group, isLoading: isGroupLoading } = useGroup();
  const { data: series, isLoading: isSeriesLoading } = useSeries();

  if (!isGroupLoading && group === null) {
    return <Navigate to="/onboarding" replace />;
  }

  const partner = group?.membros.find((member) => member.usuarioId !== me?.id);
  const meLetter = (me?.nome ?? me?.email ?? 'V')[0]?.toUpperCase() ?? 'V';

  return (
    <div className="min-h-svh pb-28">
      <AppHeader />

      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ultramarine font-heading text-sm font-semibold text-white ring-2 ring-surface">
            {meLetter}
          </div>
          <div
            className={`-ml-3 flex h-9 w-9 items-center justify-center rounded-full font-heading text-sm font-semibold ring-2 ring-surface ${
              partner
                ? 'bg-fuchsia text-white'
                : 'border-2 border-dashed border-surface-border bg-surface text-neutral-500'
            }`}
          >
            {partner ? '♥' : '?'}
          </div>
        </div>
      </div>

      {!partner && group && (
        <div className="mx-4 mb-4 rounded-xl border border-surface-border bg-surface-raised px-4 py-3">
          <p className="text-xs text-neutral-400">Convide seu par com o código</p>
          <p className="font-mono text-lg font-semibold tracking-[0.2em] text-amber">
            {group.codigoConvite}
          </p>
        </div>
      )}

      <main className="px-4">
        {isSeriesLoading ? (
          <p className="mt-10 text-center text-sm text-neutral-500">Carregando séries…</p>
        ) : series && series.length > 0 ? (
          <div className="flex flex-col gap-3">
            {series.map((item) => (
              <SeriesCard key={item.id} series={item} />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">🍿</div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">Nenhuma série ainda</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Adicione a primeira série que vocês querem acompanhar juntos.
              </p>
            </div>
            <Button onClick={() => navigate('/series/add')}>Adicionar primeira série</Button>
          </div>
        )}
      </main>

      <button
        type="button"
        onClick={() => navigate('/series/add')}
        aria-label="Adicionar série"
        className="fixed right-6 bottom-6 flex h-14 w-14 items-center justify-center rounded-full bg-flame text-2xl text-white shadow-lg shadow-flame/30 transition-transform active:scale-95"
      >
        +
      </button>
    </div>
  );
}
