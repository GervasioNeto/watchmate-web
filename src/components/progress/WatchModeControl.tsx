import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useUpdateWatchMode } from '@/hooks/useSeries';
import type { WatchMode } from '@/types/api';

const OPTIONS: { value: WatchMode; label: string }[] = [
  { value: 'JUNTOS', label: 'Juntos' },
  { value: 'SEPARADOS', label: 'Cada um' },
];

const DESCRIPTIONS: Record<WatchMode, string> = {
  JUNTOS: 'Marcar um episódio marca para os dois.',
  SEPARADOS: 'Cada um marca o que assistiu.',
};

export function WatchModeControl({ seriesId, mode }: { seriesId: string; mode: WatchMode }) {
  const updateMode = useUpdateWatchMode(seriesId);

  return (
    <div className="flex flex-col gap-1.5">
      <SegmentedControl
        label="Como vocês estão assistindo"
        options={OPTIONS}
        value={mode}
        onChange={(next) => {
          if (next !== mode) updateMode.mutate(next);
        }}
        className="sm:w-80"
      />
      <p className="text-xs text-fg-muted" aria-live="polite">
        {updateMode.isError ? 'Não foi possível trocar o modo. Tente de novo.' : DESCRIPTIONS[mode]}
      </p>
    </div>
  );
}
