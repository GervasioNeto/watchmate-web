import { getLatestAired, parseAirDate } from '@/lib/airing';
import { countInterested, getCoupleInterest } from '@/lib/interest';
import type { Person } from '@/lib/people';
import { getLastActivityAt, getMember } from '@/lib/progress';
import { getCardStatus, type CardStatus } from '@/lib/seriesCard';
import type { ListEntry } from '@/lib/seriesFilters';
import type { SeriesProgress } from '@/types/api';

// Os blocos das séries em aberto, na ordem em que aparecem: o que dá para ver agora, o
// que espera episódio novo e o que ninguém começou.
export type ListSection = 'watching' | 'waiting' | 'to-start';

const SECTION_ORDER: ListSection[] = ['watching', 'waiting', 'to-start'];

export interface SectionGroup {
  section: ListSection;
  entries: ListEntry[];
}

interface RankedEntry {
  entry: ListEntry;
  status: CardStatus;
  section: ListSection;
  // Quando a série teve novidade pela última vez, em ms (ver activityAt).
  activity: number;
  // Quantos de vocês marcaram "quero ver" (0 a 2).
  interest: number;
}

// O bloco sai da mesma frase que o card mostra.
function sectionOf(status: CardStatus): ListSection {
  switch (status.kind) {
    case 'next':
    case 'new-episode':
    // Você terminou e seu par ainda está vendo: a série segue em andamento para a dupla.
    case 'finished':
      return 'watching';
    case 'upcoming':
    case 'caught-up':
      return 'waiting';
    case 'premiere':
    case 'idea':
    case 'not-started':
      return 'to-start';
  }
}

// A última marcação de qualquer um dos dois ou, se saiu episódio novo para você, o dia
// em que ele saiu: assim um episódio que acabou de sair sobe a série para o topo.
function activityAt(entry: ListEntry, status: CardStatus, now: Date): number {
  const marked = entry.progress ? getLastActivityAt(entry.progress) : 0;
  if (status.kind !== 'new-episode') return marked;
  const aired = parseAirDate(getLatestAired(entry.series, now)?.dataExibicao ?? null);
  return Math.max(marked, aired?.getTime() ?? 0);
}

// Sem data vai para o fim.
function byDateAsc(a: Date | null, b: Date | null): number {
  if (a && b) return a.getTime() - b.getTime();
  return a ? -1 : b ? 1 : 0;
}

function upcomingDate(status: CardStatus): Date | null {
  return status.kind === 'upcoming' ? status.date : null;
}

function premiereDate(status: CardStatus): Date | null {
  return status.kind === 'premiere' ? status.date : null;
}

function compareWithin(section: ListSection, a: RankedEntry, b: RankedEntry): number {
  switch (section) {
    // Mais recente primeiro.
    case 'watching':
      return b.activity - a.activity;
    // O que sai antes primeiro; sem data, pela última vez que vocês viram.
    case 'waiting':
      return byDateAsc(upcomingDate(a.status), upcomingDate(b.status)) || b.activity - a.activity;
    // As que os dois querem ver primeiro, depois as que um quer; em cada grupo, a ideia
    // mais recente primeiro. As que ainda não estrearam vão para o fim (não dá para
    // começar), pela data de estreia.
    case 'to-start':
      return (
        Number(a.status.kind === 'premiere') - Number(b.status.kind === 'premiere') ||
        byDateAsc(premiereDate(a.status), premiereDate(b.status)) ||
        b.interest - a.interest ||
        Date.parse(b.entry.series.adicionadoEm) - Date.parse(a.entry.series.adicionadoEm)
      );
  }
}

// Uma série cujo progresso não veio (a busca falhou) vai para o fim, como se ninguém
// tivesse começado: some do lugar, mas não da lista.
function rank(entries: ListEntry[], me: Person, partner: Person | null, now: Date): RankedEntry[] {
  return entries
    .map((entry) => {
      const status: CardStatus = entry.progress
        ? getCardStatus(entry.series, entry.progress, me, partner, now)
        : { kind: 'not-started' };
      return {
        entry,
        status,
        section: sectionOf(status),
        activity: activityAt(entry, status, now),
        interest: countInterested(getCoupleInterest(entry.series, me, partner)),
      };
    })
    .sort(
      (a, b) =>
        SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section) ||
        compareWithin(a.section, a, b),
    );
}

// As séries em aberto em blocos, cada um já ordenado. Blocos vazios ficam de fora.
export function groupBySection(
  entries: ListEntry[],
  me: Person,
  partner: Person | null,
  now: Date,
): SectionGroup[] {
  const ranked = rank(entries, me, partner, now);
  return SECTION_ORDER.map((section) => ({
    section,
    entries: ranked.filter((item) => item.section === section).map((item) => item.entry),
  })).filter((group) => group.entries.length > 0);
}

type PlayableStatus = Extract<CardStatus, { kind: 'next' | 'new-episode' }>;

// O atalho do topo da lista.
export interface TonightPick {
  entry: ListEntry & { progress: SeriesProgress };
  // O seu próximo episódio, e se ele acabou de sair.
  status: PlayableStatus;
  // Vocês estão no mesmo ponto: o próximo é para ver juntos ("Hoje no sofá").
  together: boolean;
}

type PlayableEntry = RankedEntry & {
  entry: ListEntry & { progress: SeriesProgress };
  status: PlayableStatus;
};

// Tem episódio para você ver agora. Quem terminou e espera o par, ou está em dia com uma
// série no ar, não tem o que continuar.
function isPlayable(item: RankedEntry): item is PlayableEntry {
  return (
    !!item.entry.progress && (item.status.kind === 'next' || item.status.kind === 'new-episode')
  );
}

// No mesmo ponto: nenhum dos dois viu episódio que o outro não viu.
function isInSync(progress: SeriesProgress, me: Person, partner: Person): boolean {
  return (
    (getMember(progress, me.id)?.aFrente ?? 0) === 0 &&
    (getMember(progress, partner.id)?.aFrente ?? 0) === 0
  );
}

// A série para hoje: de preferência uma em que vocês estão no mesmo ponto, para verem
// juntos; senão, a sua próxima. Entre as candidatas, vale a ordem da lista (a mais
// recente primeiro).
export function pickTonight(
  entries: ListEntry[],
  me: Person,
  partner: Person | null,
  now: Date,
): TonightPick | null {
  const playable = rank(entries, me, partner, now).filter(isPlayable);
  const together = partner
    ? playable.find((item) => isInSync(item.entry.progress, me, partner))
    : undefined;
  const pick = together ?? playable[0];
  return pick ? { entry: pick.entry, status: pick.status, together: !!together } : null;
}

// Assistidas: a que vocês terminaram por último primeiro.
export function orderFinished(entries: ListEntry[]): ListEntry[] {
  const lastActivity = (entry: ListEntry) =>
    entry.progress ? getLastActivityAt(entry.progress) : 0;
  return [...entries].sort((a, b) => lastActivity(b) - lastActivity(a));
}
