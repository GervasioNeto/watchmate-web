import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAvatarImage } from '@/hooks/useAvatarImage';
import { useUpdateAvatar } from '@/hooks/useMe';
import { cx } from '@/lib/cx';
import {
  AVATAR_STYLES,
  DEFAULT_AVATAR_STYLE,
  randomAvatarSeed,
  type AvatarStyleId,
} from '@/lib/avatarStyles';
import type { Person } from '@/lib/people';
import { TONE_CLASSES, type PersonTone } from '@/lib/personTone';

const OPTION_COUNT = 8;

// O avatar atual entra como primeira opção, para você não "perder" o que já tinha
// ao gerar outros. A ordem só muda quando você pede novas opções.
function buildSeeds(currentSeed: string | null): string[] {
  const seeds = currentSeed ? [currentSeed] : [];
  while (seeds.length < OPTION_COUNT) seeds.push(randomAvatarSeed());
  return seeds;
}

interface AvatarOptionProps {
  style: AvatarStyleId;
  seed: string;
  index: number;
  selected: boolean;
  // A seleção usa a cor de quem está escolhendo.
  tone: PersonTone;
  onPick: () => void;
}

function AvatarOption({ style, seed, index, selected, tone, onPick }: AvatarOptionProps) {
  const image = useAvatarImage({ style, seed });
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={selected ? 'Avatar atual' : `Avatar ${index + 1}`}
      onClick={onPick}
      className={cx(
        'aspect-square overflow-hidden rounded-full bg-surface-2 transition-shadow',
        selected
          ? cx('ring-2 ring-offset-2 ring-offset-surface', TONE_CLASSES[tone].ring)
          : 'hover:ring-2 hover:ring-line',
      )}
    >
      {image ? (
        <img src={image} alt="" className="h-full w-full" />
      ) : (
        <span aria-hidden className="block h-full w-full animate-pulse" />
      )}
    </button>
  );
}

export function AvatarPicker({ me }: { me: Person }) {
  const updateAvatar = useUpdateAvatar();
  const [style, setStyle] = useState<AvatarStyleId>(me.avatar?.style ?? DEFAULT_AVATAR_STYLE);
  const [seeds, setSeeds] = useState(() => buildSeeds(me.avatar?.seed ?? null));

  const styleIds = Object.keys(AVATAR_STYLES) as AvatarStyleId[];
  const { label, credit } = AVATAR_STYLES[style];
  const currentSeed = me.avatar?.style === style ? me.avatar.seed : null;

  function changeStyle(next: AvatarStyleId) {
    setStyle(next);
    setSeeds(buildSeeds(me.avatar?.style === next ? me.avatar.seed : null));
  }

  return (
    // Sem fundo próprio: fica dentro da folha "Seu avatar" do perfil.
    <div className="flex flex-col gap-4">
      {styleIds.length > 1 && (
        <div role="group" aria-label="Estilo" className="flex flex-wrap gap-1.5">
          {styleIds.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === style}
              onClick={() => changeStyle(id)}
              className={cx(
                'min-h-9 rounded-md px-3 text-sm font-semibold transition-colors',
                id === style ? 'bg-fg text-canvas' : 'bg-surface-2 text-fg-muted hover:text-fg',
              )}
            >
              {AVATAR_STYLES[id].label}
            </button>
          ))}
        </div>
      )}

      <div role="group" aria-label="Escolha seu avatar" className="grid grid-cols-4 gap-3">
        {seeds.map((seed, index) => (
          <AvatarOption
            key={seed}
            style={style}
            seed={seed}
            index={index}
            selected={seed === currentSeed}
            tone={me.tone}
            onPick={() => updateAvatar.mutate({ estilo: style, semente: seed })}
          />
        ))}
      </div>

      {updateAvatar.isError && (
        <p role="alert" className="text-sm text-danger">
          Não foi possível salvar o avatar. Tente de novo.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSeeds(buildSeeds(currentSeed))}
          className="-ml-3"
        >
          <Shuffle size={16} aria-hidden />
          Gerar outros
        </Button>
        <a
          href={credit.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-fg-subtle hover:text-fg-muted"
        >
          {label} por {credit.artist} · {credit.license}
        </a>
      </div>
    </div>
  );
}
