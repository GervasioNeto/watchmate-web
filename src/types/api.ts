// Field names mirror the API's JSON response shape (Portuguese, from the Prisma schema).
// Type names are in English to follow this codebase's naming convention.

export interface User {
  id: string;
  email: string;
  nome: string | null;
  criadoEm: string;
}

export interface GroupMember {
  id: string;
  grupoId: string;
  usuarioId: string;
  entrouEm: string;
}

export interface Group {
  id: string;
  nome: string | null;
  codigoConvite: string;
  criadoEm: string;
  membros: GroupMember[];
}

export interface GroupMemberSummary {
  usuario: {
    id: string;
    nome: string | null;
    email: string;
  };
}

export interface MeGroupSummary {
  nome: string | null;
  codigoConvite: string;
  membros: GroupMemberSummary[];
}

export interface Me extends User {
  membroDoGrupo: { grupo: MeGroupSummary } | null;
}

export interface SeasonSnapshot {
  numero: number;
  totalEpisodios: number;
}

export interface TrackedSeries {
  id: string;
  grupoId: string;
  tmdbId: number;
  nome: string;
  posterPath: string | null;
  adicionadoEm: string;
  adicionadoPor: string | null;
  // Snapshot do TMDB no momento em que a série foi adicionada — não
  // atualiza sozinho se a série ganhar uma temporada nova depois.
  temporadas: SeasonSnapshot[];
  sinopse: string | null;
  notaMedia: number | null;
  status: string | null;
  backdropPath: string | null;
  generos: string[];
  primeiraExibicaoEm: string | null;
  idiomaOriginal: string | null;
  nomeOriginal: string | null;
  englishName: string | null;
}

export interface EpisodeProgress {
  id: string;
  serieAcompanhadaId: string;
  temporada: number;
  episodio: number;
  assistidoEm: string | null;
  marcadoPor: string | null;
}

export interface SeriesSearchResult {
  tmdbId: number;
  name: string;
  posterPath: string | null;
  firstAirYear: number | null;
  englishName: string | null;
}

export interface SeasonEpisode {
  numero: number;
  titulo: string;
  resumo: string | null;
  dataExibicao: string | null;
  duracaoMinutos: number | null;
  imagem: string | null;
}
