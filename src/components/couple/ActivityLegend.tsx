import { dayKind, sumActivity, type DayActivity } from '@/lib/coupleActivity';
import { cx } from '@/lib/cx';
import type { Person } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';

interface ActivityLegendProps {
  days: DayActivity[];
  me: Person;
  partner: Person | null;
}

interface LegendItem {
  key: string;
  dot: string;
  count: number;
  label: string;
}

// Legenda das cores com o total de cada uma no período: explica as bolinhas e resume
// o período ao mesmo tempo. Só entra o que aconteceu: nada de "0 só você". A
// metade-metade aparece se algum dia foi assim.
export function ActivityLegend({ days, me, partner }: ActivityLegendProps) {
  const totals = sumActivity(days);
  const hasSplitDay = days.some((day) => dayKind(day) === 'split');

  const candidates: LegendItem[] = partner
    ? [
        { key: 'together', dot: 'bg-together', count: totals.together, label: 'juntos' },
        { key: 'me', dot: TONE_CLASSES[me.tone].solid, count: totals.me, label: 'só você' },
        {
          key: 'partner',
          dot: TONE_CLASSES[partner.tone].solid,
          count: totals.partner,
          label: `só ${partner.shortName}`,
        },
      ]
    : [
        {
          key: 'me',
          dot: TONE_CLASSES[me.tone].solid,
          count: totals.me,
          label: totals.me === 1 ? 'episódio' : 'episódios',
        },
      ];
  const items = candidates.filter((item) => item.count > 0);

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-muted">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span aria-hidden className={cx('h-2 w-2 shrink-0 rounded-full', item.dot)} />
          <span>
            <span className="font-semibold text-fg tabular-nums">{item.count}</span> {item.label}
          </span>
        </li>
      ))}
      {partner && hasSplitDay && (
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="flex h-2 w-2 shrink-0 overflow-hidden rounded-full">
            <span className={cx('w-1/2', TONE_CLASSES[me.tone].solid)} />
            <span className={cx('w-1/2', TONE_CLASSES[partner.tone].solid)} />
          </span>
          cada um na sua hora
        </li>
      )}
    </ul>
  );
}
