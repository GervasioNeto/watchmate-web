export function tmdbPosterUrl(posterPath: string | null, size: 'w185' | 'w342' = 'w342') {
  if (!posterPath) return null;
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

export function tmdbBackdropUrl(backdropPath: string | null, size: 'w780' | 'original' = 'w780') {
  if (!backdropPath) return null;
  return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
}

// `original` para a imagem grande da folha do episódio (o TMDB não tem um tamanho médio).
export function tmdbStillUrl(imagem: string | null, size: 'w300' | 'original' = 'w300') {
  if (!imagem) return null;
  return `https://image.tmdb.org/t/p/${size}${imagem}`;
}
