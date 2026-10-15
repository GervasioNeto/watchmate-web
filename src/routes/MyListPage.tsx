import { Navigate, useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { CoupleCard } from '@/components/couple/CoupleCard';
import { InviteCode } from '@/components/InviteCode';
import { ContinueWatchingCard } from '@/components/series/ContinueWatchingCard';
import { SERIES_GRID } from '@/components/series/seriesGrid';
import { SeriesLibrary } from '@/components/series/SeriesLibrary';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouple } from '@/hooks/useCouple';
import { useGroup } from '@/hooks/useGroup';
import { useListEntries } from '@/hooks/useListEntries';
import { pickTonight } from '@/lib/listOrder';

export function MyListPage() {
  const navigate = useNavigate();
  const { me, partner } = useCouple();
  const { data: group, isLoading: isGroupLoading } = useGroup();
  const { entries, isSeriesLoading, isProgressLoading } = useListEntries();

  if (!isGroupLoading && group === null) {
    return <Navigate to="/onboarding" replace />;
  }

  // A série de hoje ("Hoje no sofá" ou "Continuar assistindo"). Espera todo o progresso,
  // como a lista, para o atalho não trocar de série enquanto carrega.
  const tonight = me && !isProgressLoading ? pickTonight(entries, me, partner, new Date()) : null;

  const goToAdd = () => navigate('/series/add');

  return (
    <>
      <AppHeader />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-6 pb-16">
        <CoupleCard
          groupName={group?.nome ?? 'Lista de vocês'}
          entries={entries}
          isProgressLoading={isProgressLoading}
          onAdd={goToAdd}
        />

        {group && me && !partner && (
          <section className="flex flex-col gap-1 rounded-lg border border-line p-4">
            <h2 className="text-sm font-semibold">Convide seu par</h2>
            <p className="text-sm text-fg-muted">
              Mande esse código para a pessoa entrar no grupo pelo WatchMate.
            </p>
            <InviteCode code={group.codigoConvite} />
          </section>
        )}

        {isSeriesLoading ? (
          <div className="flex flex-col gap-8" aria-label="Carregando séries">
            <Skeleton className="h-36 rounded-lg" />
            <div className={SERIES_GRID}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-2/3 rounded-md" />
              ))}
            </div>
          </div>
        ) : entries.length > 0 ? (
          <>
            {tonight && <ContinueWatchingCard pick={tonight} />}
            <SeriesLibrary entries={entries} isProgressLoading={isProgressLoading} />
          </>
        ) : (
          <section className="flex flex-col items-start gap-3 rounded-lg border border-line p-5">
            <h2 className="text-lg font-bold">Nenhuma série ainda</h2>
            <p className="text-sm text-fg-muted">
              Adicione a primeira série que vocês querem acompanhar.
            </p>
            <Button onClick={goToAdd}>Adicionar série</Button>
          </section>
        )}
      </main>
    </>
  );
}
