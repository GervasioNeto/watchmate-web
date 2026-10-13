// Field names mirror the API's JSON response shape (Portuguese, from the Prisma schema).
// Type names are in English to follow this codebase's naming convention.

// Both null until the user picks an avatar — UI falls back to initials.
export interface AvatarFields {
  avatarEstilo: string | null;
  avatarSemente: string | null;
}

export interface User extends AvatarFields {
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
  // Ordem de entrada no grupo: define a cor fixa de cada pessoa (ver buildCouple).
  entrouEm: string;
  usuario: AvatarFields & {
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

// Modo da série, ainda devolvido pela API. O app não usa mais: toda marcação diz
// para quem vale (`ProgressScope`).
export type WatchMode = 'JUNTOS' | 'SEPARADOS';

// Para quem vale uma marcação: só você ou os dois.
export type ProgressScope = 'me' | 'both';

export interface TrackedSeries {
  id: string;
  grupoId: string;
  tmdbId: number;
  nome: string;
  posterPath: string | null;
  modo: WatchMode;
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

export interface EpisodePosition {
  temporada: number;
  episodio: number;
}

export interface MemberProgress {
  usuarioId: string;
  nome: string | null;
  assistidos: number;
  percentual: number | null;
  posicaoAtual: EpisodePosition | null;
  ultimoAssistidoEm: string | null;
  // Episódios que esse membro viu e pelo menos um outro membro ainda não.
  aFrente: number;
}

export interface EpisodeWatcher {
  usuarioId: string;
  assistidoEm: string;
  // Marcado para o grupo todo de uma vez ("assistimos juntos").
  juntos: boolean;
  // Quem registrou: pode ser o parceiro, ao marcar para os dois.
  marcadoPor: string | null;
}

export interface EpisodeProgressEntry extends EpisodePosition {
  assistidoPor: EpisodeWatcher[];
}

export interface SeriesProgress {
  modo: WatchMode;
  totalEpisodios: number;
  membros: MemberProgress[];
  // Episódios que todos os membros já viram.
  emComum: {
    assistidos: number;
    percentual: number | null;
    posicaoAtual: EpisodePosition | null;
  };
  episodios: EpisodeProgressEntry[];
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

export interface EpisodeUser {
  id: string;
  nome: string | null;
}

// Conteúdo do parceiro em episódio que você ainda não viu vem com `oculto: true`
// e sem o conteúdo — a API esconde para não dar spoiler.
type Spoilerable<Field extends string> =
  ({ oculto: false } & Record<Field, string>) | ({ oculto: true } & Record<Field, null>);

interface EpisodeContentBase {
  id: string;
  serieAcompanhadaId: string;
  temporada: number;
  episodio: number;
  usuarioId: string;
  criadoEm: string;
  usuario: EpisodeUser;
}

export type EpisodeReaction = EpisodeContentBase & { atualizadoEm: string } & Spoilerable<'emoji'>;

export type EpisodeComment = EpisodeContentBase & Spoilerable<'texto'>;
