const GENRE_ACCENTS = [
  'border-ultramarine bg-ultramarine text-white',
  'border-raspberry bg-raspberry text-white',
  'border-amber bg-amber text-white',
  'border-flame bg-flame text-white',
];

export function GenrePills({ genres }: { genres: string[] }) {
  if (genres.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {genres.map((genero, index) => (
        <span
          key={genero}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide shadow-sm transition-transform hover:scale-105 ${
            GENRE_ACCENTS[index % GENRE_ACCENTS.length]
          }`}
        >
          {genero}
        </span>
      ))}
    </div>
  );
}
