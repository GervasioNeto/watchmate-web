import { Navigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { BackButton } from '@/components/BackButton';
import { CoupleHero } from '@/components/couple/CoupleHero';
import { CoupleWeek } from '@/components/couple/CoupleWeek';
import { MonthCalendar } from '@/components/couple/MonthCalendar';
import { RecentActivity } from '@/components/couple/RecentActivity';
import { EditableTextRow, SettingsList } from '@/components/ui/SettingsList';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouple } from '@/hooks/useCouple';
import { useCoupleStats } from '@/hooks/useCoupleStats';
import { useGroup, usePatchGroup } from '@/hooks/useGroup';
import { useListEntries } from '@/hooks/useListEntries';
import { collectWatchEvents } from '@/lib/coupleActivity';

// Tudo sobre a dupla num lugar só: quem são e o placar, a semana, o mês, o que cada um
// viu por último e, no fim, os ajustes do grupo. Os números saem do progresso que a
// lista já carrega (o mesmo cache).
export function CouplePage() {
  const { me, partner } = useCouple();
  const { data: group, isLoading: isGroupLoading } = useGroup();
  const patchGroup = usePatchGroup();
  const { entries } = useListEntries();
  const stats = useCoupleStats();

  if (!isGroupLoading && group === null) {
    return <Navigate to="/onboarding" replace />;
  }

  const now = new Date();
  const since = group ? new Date(group.criadoEm) : null;
  const events =
    me && stats ? collectWatchEvents(entries, { meId: me.id, partnerId: partner?.id ?? null }) : [];

  return (
    <div className="min-h-svh">
      <AppHeader />

      <main className="mx-auto flex max-w-xl flex-col gap-8 px-4 pt-6 pb-16">
        <div className="flex flex-col gap-4">
          {/* O botão vem antes no DOM (primeiro no Tab) e fica por cima do canto do hero. */}
          <div className="relative">
            <BackButton className="absolute top-2 left-2" />
            {me && group ? (
              <CoupleHero
                me={me}
                partner={partner}
                groupName={group.nome}
                since={since}
                inviteCode={partner ? null : group.codigoConvite}
                stats={stats}
              />
            ) : (
              <Skeleton className="h-80 rounded-lg" />
            )}
          </div>

          {me && stats && since ? (
            <>
              <CoupleWeek events={events} me={me} partner={partner} now={now} />
              <MonthCalendar events={events} me={me} partner={partner} since={since} now={now} />
              <RecentActivity events={events} me={me} partner={partner} now={now} />
            </>
          ) : (
            <div className="flex flex-col gap-4" aria-label="Carregando os números da dupla">
              <Skeleton className="h-44 rounded-lg" />
              <Skeleton className="h-96 rounded-lg" />
            </div>
          )}
        </div>

        {group && (
          <SettingsList title="Ajustes da dupla">
            <EditableTextRow
              label="Nome do grupo"
              value={group.nome ?? ''}
              placeholder="Dê um nome para a dupla"
              onSave={(value) => patchGroup.mutateAsync(value)}
            />
          </SettingsList>
        )}
      </main>
    </div>
  );
}
