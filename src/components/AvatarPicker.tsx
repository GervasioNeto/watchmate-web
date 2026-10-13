import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { ApiError } from '@/api/client';
import { useUpdateAvatar } from '@/hooks/useMe';
import {
  AVATAR_STYLES,
  DEFAULT_AVATAR_STYLE,
  avatarDataUri,
  isAvatarStyle,
  randomAvatarSeed,
  type AvatarStyleId,
} from '@/lib/avatar';
import { AVATAR_SHAPE } from '@/components/UserAvatar';
import type { AvatarFields } from '@/types/api';

const OPTION_COUNT = 8;

function randomSeeds() {
  return Array.from({ length: OPTION_COUNT }, randomAvatarSeed);
}

interface AvatarPickerProps {
  current: AvatarFields | undefined;
  onPicked?: () => void;
}

export function AvatarPicker({ current, onPicked }: AvatarPickerProps) {
  const updateAvatar = useUpdateAvatar();
  const currentStyle = isAvatarStyle(current?.avatarEstilo) ? current.avatarEstilo : null;

  const [style, setStyle] = useState<AvatarStyleId>(currentStyle ?? DEFAULT_AVATAR_STYLE);
  const [seeds, setSeeds] = useState(randomSeeds);
  const [error, setError] = useState<string | null>(null);

  const styleIds = Object.keys(AVATAR_STYLES) as AvatarStyleId[];
  const { credit } = AVATAR_STYLES[style];

  function isSelected(seed: string) {
    return currentStyle === style && current?.avatarSemente === seed;
  }

  function handlePick(seed: string) {
    setError(null);
    updateAvatar.mutate(
      { estilo: style, semente: seed },
      {
        onSuccess: () => onPicked?.(),
        onError: (err) =>
          setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o avatar.'),
      },
    );
  }

  // Mantém o avatar atual visível como primeira opção enquanto o usuário
  // embaralha, pra ele não "perder" o que já tinha escolhido.
  const options =
    currentStyle === style && current?.avatarSemente
      ? [current.avatarSemente, ...seeds.filter((seed) => seed !== current.avatarSemente)].slice(
          0,
          OPTION_COUNT,
        )
      : seeds;

  return (
    <div className="flex flex-col gap-3">
      {styleIds.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {styleIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setStyle(id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                id === style
                  ? 'bg-flame text-white'
                  : 'bg-surface text-neutral-400 hover:text-white'
              }`}
            >
              {AVATAR_STYLES[id].label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {options.map((seed) => {
          const selected = isSelected(seed);
          const saving = updateAvatar.isPending && updateAvatar.variables?.semente === seed;
          return (
            <button
              key={seed}
              type="button"
              onClick={() => handlePick(seed)}
              disabled={updateAvatar.isPending}
              aria-pressed={selected}
              aria-label={selected ? 'Avatar atual' : 'Escolher este avatar'}
              className={`aspect-square overflow-hidden bg-surface transition-all active:scale-95 disabled:cursor-wait ${AVATAR_SHAPE} ${
                selected
                  ? 'ring-2 ring-flame ring-offset-2 ring-offset-surface-raised'
                  : 'opacity-90 hover:opacity-100'
              } ${saving ? 'animate-pulse' : ''}`}
            >
              <img src={avatarDataUri(style, seed)} alt="" className="h-full w-full" />
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSeeds(randomSeeds())}
          className="flex items-center gap-1.5 text-xs font-semibold text-flame hover:text-flame/80"
        >
          <Shuffle size={14} />
          Gerar outros
        </button>
        <a
          href={credit.url}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-neutral-500 hover:text-neutral-400"
        >
          {AVATAR_STYLES[style].label} por {credit.artist} · {credit.license}
        </a>
      </div>

      {error && <p className="text-xs text-fuchsia">{error}</p>}
    </div>
  );
}
