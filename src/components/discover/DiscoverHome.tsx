import { useId } from 'react';
import { CoupleAvatars } from '@/components/couple/CoupleAvatars';
import { CouplesBadge, RankBadge } from '@/components/discover/PosterTile';
import { RecentSearches } from '@/components/discover/RecentSearches';
import { Shelf } from '@/components/discover/Shelf';
import { TmdbCredit } from '@/components/discover/TmdbCredit';
import { ChipGroup, type ChipOption } from '@/components/ui/ChipGroup';
import { useCouple } from '@/hooks/useCouple';
import {
  useCommunitySeries,
  useCoupleSuggestions,
  useExploreOrigin,
  useOnTheAir,
  useTrending,
} from '@/hooks/useDiscover';
import { basedOnLabel } from '@/lib/discover';
import type { DiscoverOrigin, SeriesSearchResult } from '@/types/api';

// Só os dez primeiros do "Em alta" ganham o número.
const RANKED = 10;

const ORIGIN_OPTIONS: ChipOption<DiscoverOrigin>[] = [
  { value: 'all', label: 'Todas' },
  { value: 'th', label: 'Tailândia' },
  { value: 'kr', label: 'Coreia' },
  { value: 'jp', label: 'Japão' },
  { value: 'anime', label: 'Animes' },
];

interface DiscoverHomeProps {
  onOpen: (series: SeriesSearchResult) => void;
  onPickRecent: (query: string) => void;
}

// A tela de busca antes de digitar: as buscas recentes, as sugestões feitas para a dupla, o
// que está bombando (com a origem que vocês escolherem) e o que mais duplas do WatchMate
// estão salvando. Tocar num pôster abre a prévia; o "+" adiciona direto.
export function DiscoverHome({ onOpen, onPickRecent }: DiscoverHomeProps) {
  return (
    <div className="flex flex-col gap-9 pt-2 pb-4">
      <RecentSearches onPick={onPickRecent} />
      <ForUsShelf onOpen={onOpen} />
      <ExploreSection onOpen={onOpen} />
      <CommunityShelf onOpen={onOpen} />
      <TmdbCredit />
    </div>
  );
}

// "Para vocês dois": o que o TMDB recomenda a partir das séries que vocês mais assistiram.
// Some enquanto a lista está vazia (não há de onde partir).
function ForUsShelf({ onOpen }: { onOpen: DiscoverHomeProps['onOpen'] }) {
  const { me, partner } = useCouple();
  const suggestions = useCoupleSuggestions();

  return (
    <Shelf
      title={partner ? 'Para vocês dois' : 'Para você'}
      subtitle={basedOnLabel(suggestions.data?.basedOn ?? [])}
      leading={me && <CoupleAvatars me={me} partner={partner} size="sm" />}
      items={suggestions.data?.items}
      isPending={suggestions.isPending}
      isError={suggestions.isError}
      onRetry={() => void suggestions.refetch()}
      onOpen={onOpen}
    />
  );
}

// O "Explorar": uma origem escolhida (guardada no aparelho) vale para as duas estantes.
function ExploreSection({ onOpen }: { onOpen: DiscoverHomeProps['onOpen'] }) {
  const titleId = useId();
  const [origin, setOrigin] = useExploreOrigin();
  const trending = useTrending(origin);
  const onTheAir = useOnTheAir(origin);

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h2 id={titleId} className="text-xl leading-tight font-extrabold tracking-tight">
          Explorar
        </h2>
        <ChipGroup
          label="Origem das séries"
          options={ORIGIN_OPTIONS}
          value={origin}
          onChange={setOrigin}
          bleed
        />
      </div>

      <div className="flex flex-col gap-8">
        <Shelf
          title="Em alta"
          subtitle={
            origin === 'all' ? 'As mais vistas da semana' : 'As séries novas mais populares agora'
          }
          items={trending.data}
          isPending={trending.isPending}
          isError={trending.isError}
          isRefreshing={trending.isPlaceholderData}
          onRetry={() => void trending.refetch()}
          onOpen={onOpen}
          renderBadge={(_, index) => index < RANKED && <RankBadge rank={index + 1} />}
          emptyText="Nada em alta por aqui agora."
        />
        <Shelf
          title="No ar esta semana"
          subtitle="Com episódio novo nos próximos 7 dias"
          items={onTheAir.data}
          isPending={onTheAir.isPending}
          isError={onTheAir.isError}
          isRefreshing={onTheAir.isPlaceholderData}
          onRetry={() => void onTheAir.refetch()}
          onOpen={onOpen}
          emptyText="Nenhuma série com episódio nesta semana."
        />
      </div>
    </section>
  );
}

// O que mais duplas do WatchMate adicionaram no último mês. Só aparece quando várias duplas
// salvaram a mesma série (a API cuida disso, para não expor a lista de ninguém).
function CommunityShelf({ onOpen }: { onOpen: DiscoverHomeProps['onOpen'] }) {
  const community = useCommunitySeries();

  return (
    <Shelf
      title="Salvas pela galera"
      subtitle="As que mais duplas do WatchMate adicionaram no último mês"
      items={community.data}
      isPending={community.isPending}
      isError={community.isError}
      onRetry={() => void community.refetch()}
      onOpen={onOpen}
      renderBadge={(series) => <CouplesBadge count={series.groupCount} />}
    />
  );
}
