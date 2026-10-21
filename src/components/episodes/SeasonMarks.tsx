import { Check } from 'lucide-react';
import { MarkDot } from '@/components/episodes/EpisodeMark';
import { cx } from '@/lib/cx';
import { seasonWatchedBy, type EpisodeMarkKind, type SeasonMarkCounts } from '@/lib/episodeMark';
import type { Person } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';

interface SeasonMeterProps {
  counts: SeasonMarkCounts;
  total: number;
  me: Person;
  partner: Person | null;
  // A pílula marcada é escura no claro e clara no escuro: o trilho vazio acompanha.
  selected: boolean;
}

// O progresso de uma temporada dentro da pílula dela: um trilho fino para cada um, na cor
// de cada um. Terminaram tudo juntos: o trilho vira o check laranja do "juntos". Temporada
// em que ninguém começou fica só com o rótulo.
export function SeasonMeter({ counts, total, me, partner, selected }: SeasonMeterProps) {
  const watched = seasonWatchedBy(counts);
  if (total <= 0 || (watched.me === 0 && (!partner || watched.partner === 0))) return null;

  if (partner ? counts.together >= total : watched.me >= total) {
    return (
      <span
        className={cx(
          'flex h-4 w-4 items-center justify-center rounded-full',
          partner ? 'bg-together text-on-together' : cx('text-canvas', TONE_CLASSES[me.tone].solid),
        )}
      >
        <Check size={10} strokeWidth={4} aria-hidden />
        <span className="sr-only">{partner ? ', vocês viram tudo juntos' : ', terminada'}</span>
      </span>
    );
  }

  const rails = [{ person: me, count: watched.me }];
  if (partner) rails.push({ person: partner, count: watched.partner });

  return (
    <span className="flex w-6 flex-col gap-[3px]">
      {rails.map(({ person, count }) => (
        <span
          key={person.id}
          aria-hidden
          className={cx(
            'h-[3px] overflow-hidden rounded-full',
            selected ? 'bg-canvas/25' : 'bg-line',
          )}
        >
          <span
            className={cx('block h-full rounded-full', TONE_CLASSES[person.tone].solid)}
            style={{ width: `${Math.min(100, (count / total) * 100)}%` }}
          />
        </span>
      ))}
      <span className="sr-only">
        {partner
          ? `, você viu ${watched.me} de ${total}, ${partner.shortName} viu ${watched.partner}`
          : `, você viu ${watched.me} de ${total}`}
      </span>
    </span>
  );
}

interface SeasonLegendProps {
  counts: SeasonMarkCounts;
  total: number;
  me: Person;
  partner: Person | null;
}

interface LegendItem {
  kind: EpisodeMarkKind;
  count: number;
  label: string;
}

// Embaixo das temporadas: o que cada cor da barra dos episódios quer dizer, com quantos episódios
// estão em cada uma. Explica a lista e resume a temporada de uma vez, como a legenda do
// calendário da dupla. Só entra o que existe: nada de "0 só você".
export function SeasonLegend({ counts, total, me, partner }: SeasonLegendProps) {
  if (total <= 0) return null;
  const seen = counts.together + counts.apart + counts.me + counts.partner;
  const unseen = Math.max(0, total - seen);

  const candidates: LegendItem[] = partner
    ? [
        { kind: 'together', count: counts.together, label: 'juntos' },
        { kind: 'apart', count: counts.apart, label: 'cada um na sua hora' },
        { kind: 'me', count: counts.me, label: 'só você' },
        { kind: 'partner', count: counts.partner, label: `só ${partner.shortName}` },
        { kind: 'none', count: unseen, label: 'por ver' },
      ]
    : [
        { kind: 'me', count: counts.me, label: counts.me === 1 ? 'visto' : 'vistos' },
        { kind: 'none', count: unseen, label: 'por ver' },
      ];
  const items = candidates.filter((item) => item.count > 0);

  return (
    <ul
      aria-label="Resumo da temporada"
      className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-muted"
    >
      {items.map((item) => (
        <li key={item.kind} className="flex items-center gap-1.5">
          <MarkDot kind={item.kind} me={me} partner={partner} />
          <span>
            <span className="font-semibold text-fg tabular-nums">{item.count}</span> {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
