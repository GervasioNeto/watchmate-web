import { Check } from 'lucide-react';
import { SeasonTrack } from '@/components/series/SeasonTrack';
import { Avatar } from '@/components/ui/Avatar';
import { ApiError } from '@/api/client';
import { useSetPersonColor } from '@/hooks/usePersonColor';
import { useRadioGroup } from '@/hooks/useRadioGroup';
import { cx } from '@/lib/cx';
import type { Person } from '@/lib/people';
import { PERSON_COLORS, PERSON_TONES, TONE_CLASSES, toneName } from '@/lib/personTone';
import type { EpisodeKind } from '@/lib/seasonTrack';

// Colunas da grade: 15 cores viram 3 linhas de 5, que cabem num celular de 360px.
const COLUMNS = 5;

// Uma temporada de exemplo para a prévia, com tudo o que pode aparecer nas contas: o que
// vocês viram juntos, o que cada um viu sozinho, cada um na sua hora e o que falta.
const PREVIEW_WITH_PARTNER: EpisodeKind[] = [
  'together',
  'together',
  'me',
  'together',
  'split',
  'partner',
  'partner',
  'together',
  'empty',
  'empty',
  'unaired',
  'unaired',
];
const PREVIEW_SOLO: EpisodeKind[] = [
  'me',
  'me',
  'me',
  'me',
  'me',
  'me',
  'me',
  'empty',
  'empty',
  'empty',
  'unaired',
  'unaired',
];

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface ColorPickerProps {
  me: Person;
  partner: Person | null;
}

// A sua cor na dupla: uma prévia de como as contas ficam com ela, ao lado da cor do par e
// do laranja do "juntos", e a grade da paleta. A cor do par fica bloqueada (cada um tem a
// sua) e a escolha vale na hora, para o app inteiro. Sem fundo nem título próprios: fica
// dentro da folha "Sua cor na dupla" do perfil.
export function ColorPicker({ me, partner }: ColorPickerProps) {
  const setColor = useSetPersonColor();
  const partnerTone = partner?.tone ?? null;
  const { groupProps, itemProps } = useRadioGroup(
    PERSON_TONES,
    me.tone,
    (tone) => setColor.mutate(tone),
    { columns: COLUMNS, isDisabled: (tone) => tone === partnerTone },
  );

  const conflict = setColor.error instanceof ApiError && setColor.error.status === 409;

  return (
    <div className="flex flex-col gap-5 pt-1">
      <ColorPreview me={me} partner={partner} />

      <div
        {...groupProps}
        aria-label="Paleta de cores"
        className="grid grid-cols-5 gap-x-3 gap-y-4 px-1"
      >
        {PERSON_COLORS.map((color, index) => {
          const isMine = color.id === me.tone;
          const isPartners = color.id === partnerTone;
          const label = capitalize(color.name);
          return (
            <button
              key={color.id}
              type="button"
              {...itemProps(index)}
              aria-label={isPartners && partner ? `${label}, a cor de ${partner.shortName}` : label}
              title={isPartners && partner ? `${label} · cor de ${partner.shortName}` : label}
              disabled={isPartners}
              onClick={() => setColor.mutate(color.id)}
              className={cx(
                'relative mx-auto flex aspect-square w-full max-w-12 items-center justify-center rounded-full transition-transform duration-150',
                TONE_CLASSES[color.id].solid,
                isMine && 'ring-2 ring-fg ring-offset-4 ring-offset-surface',
                !isMine && !isPartners && 'hover:scale-110',
                isPartners && 'cursor-not-allowed opacity-30',
              )}
            >
              {isMine && <Check size={20} strokeWidth={3} aria-hidden className="text-canvas" />}
              {isPartners && partner && (
                <Avatar
                  person={partner}
                  size="xs"
                  className="absolute -right-1.5 -bottom-1.5 ring-2 ring-surface"
                />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs leading-relaxed text-fg-muted">
        {partner
          ? `Cada um tem a sua: a de ${partner.shortName} fica bloqueada. O que vocês veem juntos é sempre o laranja do WatchMate.`
          : 'Quando seu par entrar, ele escolhe uma cor diferente da sua.'}
      </p>

      {setColor.isError && (
        <p role="alert" className="text-sm text-danger">
          {conflict && partner
            ? `${partner.shortName} acabou de escolher essa cor. Escolha outra.`
            : 'Não foi possível salvar a cor. Tente de novo.'}
        </p>
      )}
    </div>
  );
}

// Como as contas de uma temporada ficam com a sua cor, ao lado das outras duas. É só para
// os olhos: a escolha em si é anunciada pela grade.
function ColorPreview({ me, partner }: { me: Person; partner: Person | null }) {
  const track = { season: 1, episodes: partner ? PREVIEW_WITH_PARTNER : PREVIEW_SOLO };
  return (
    <div aria-hidden className="flex flex-col gap-3 rounded-md bg-canvas px-3 py-3.5">
      <SeasonTrack track={track} me={me} partner={partner} />
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
        <LegendItem
          dot={TONE_CLASSES[me.tone].solid}
          label={`Você · ${capitalize(toneName(me.tone))}`}
        />
        {partner && <LegendItem dot={TONE_CLASSES[partner.tone].solid} label={partner.shortName} />}
        {partner && <LegendItem dot="bg-together" label="Juntos" />}
      </ul>
    </div>
  );
}

function LegendItem({ dot, label }: { dot: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={cx('h-2 w-2 rounded-full', dot)} />
      {label}
    </li>
  );
}
