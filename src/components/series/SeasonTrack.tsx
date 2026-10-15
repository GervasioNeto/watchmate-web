import { cx } from '@/lib/cx';
import type { Person } from '@/lib/people';
import { TONE_CLASSES } from '@/lib/personTone';
import {
  describeTrack,
  toRuns,
  type EpisodeKind,
  type SeasonTrack as SeasonTrackData,
} from '@/lib/seasonTrack';

// Até quantos episódios cada um vira uma conta. Acima disso (temporadas longas de anime),
// as contas ficariam finas demais no celular: episódios seguidos do mesmo jeito viram um
// trecho só.
const MAX_BEADS = 24;

// Até aqui as contas cabem com 2px entre elas; daí até MAX_BEADS, com 1px.
const ROOMY_BEADS = 12;

interface SeasonTrackProps {
  track: SeasonTrackData;
  me: Person;
  partner: Person | null;
  className?: string;
}

// A temporada em contas, uma por episódio, nas cores da dupla: rosa o que viram juntos,
// metade de cada cor o que cada um viu na sua hora, a cor de quem viu sozinho. O que falta
// ver fica cinza; o que ainda não saiu é só um fio.
export function SeasonTrack({ track, me, partner, className }: SeasonTrackProps) {
  const count = track.episodes.length;
  const pieces =
    count <= MAX_BEADS
      ? track.episodes.map((kind) => ({ kind, count: 1 }))
      : toRuns(track.episodes);
  const description = describeTrack(track, partner?.shortName ?? null);

  return (
    <div
      title={description}
      className={cx(
        'flex h-1.5 items-center',
        count > ROOMY_BEADS && count <= MAX_BEADS ? 'gap-px' : 'gap-0.5',
        className,
      )}
    >
      {pieces.map((piece, index) => (
        <Bead key={index} kind={piece.kind} grow={piece.count} me={me} partner={partner} />
      ))}
      <span className="sr-only">{description}</span>
    </div>
  );
}

interface BeadProps {
  kind: EpisodeKind;
  // Quantos episódios a conta representa: a largura é proporcional.
  grow: number;
  me: Person;
  partner: Person | null;
}

function Bead({ kind, grow, me, partner }: BeadProps) {
  const base = 'min-w-0 basis-0 rounded-full';
  const style = { flexGrow: grow };

  if (kind === 'unaired') {
    return <span aria-hidden style={style} className={cx(base, 'h-0.5 bg-line')} />;
  }

  // Cada um na sua hora: metade de cima sua, metade de baixo do par (como o dia dividido).
  if (kind === 'split' && partner) {
    return (
      <span aria-hidden style={style} className={cx(base, 'flex h-full flex-col overflow-hidden')}>
        <span className={cx('flex-1', TONE_CLASSES[me.tone].solid)} />
        <span className={cx('flex-1', TONE_CLASSES[partner.tone].solid)} />
      </span>
    );
  }

  const fill =
    kind === 'together'
      ? 'bg-together'
      : kind === 'me'
        ? TONE_CLASSES[me.tone].solid
        : kind === 'partner' && partner
          ? TONE_CLASSES[partner.tone].solid
          : 'bg-line';
  return <span aria-hidden style={style} className={cx(base, 'h-full', fill)} />;
}
