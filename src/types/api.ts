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
  // A cor da pessoa na dupla: um id da paleta (ver PERSON_COLORS em lib/personTone.ts).
  // Null em membros criados antes das cores existirem: o app usa a cor padrão.
  cor: string | null;
}

export interface Group {
  id: string;
  nome: string | null;
  codigoConvite: string;
  criadoEm: string;
  membros: GroupMember[];
}

// Recado que o membro deixa para o par. Os dois são null juntos (sem recado).
export interface NoteFields {
  recado: string | null;
  recadoEm: string | null;
}

export interface GroupMemberSummary extends NoteFields {
  // Ordem de entrada no grupo: desempata as cores se alguma vier repetida (ver buildCouple).
  entrouEm: string;
  // A cor escolhida na paleta (ver PERSON_COLORS em lib/personTone.ts). Null: cor padrão.
  cor: string | null;
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
  // Snapshot do TMDB. A API renova o das séries no ar, então temporadas e episódios
  // novos aparecem sozinhos.
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
  // Do mesmo snapshot. Null quando o TMDB não informa: série que acabou não tem próximo,
  // e série que a API ainda não renovou fica sem os dois (ver lib/airing.ts).
  ultimoEpisodioExibido: AiringEpisode | null;
  proximoEpisodio: AiringEpisode | null;
  // "Quero ver": ids de quem do grupo marcou a série, na ordem em que marcou.
  interessados: string[];
  // A reação que vocês mais usaram na série, contando só o que não é spoiler para você.
  // Null enquanto houver poucas reações.
  emojiDaSerie: string | null;
}

export interface SeriesInterest {
  interessados: string[];
}

// Avisos no Telegram (o bot manda ao par o que você fez no app):
// - unavailable: a API está sem bot, então a seção nem aparece;
// - off: nunca conectou;
// - pending: tocou em "Conectar" e ainda não tocou em "Iniciar" no Telegram;
// - on: recebendo avisos;
// - paused: conectado, com os avisos desligados (pelo app, pelo /parar ou porque o bot
//   foi bloqueado).
export type TelegramStatus = 'unavailable' | 'off' | 'pending' | 'on' | 'paused';

export interface TelegramState {
  status: TelegramStatus;
  // O @ da pessoa no Telegram (sem a arroba), quando ela tem um.
  username: string | null;
  // O @ do bot, sem a arroba.
  botUsername: string | null;
  // Só em "pending": o link que abre a conversa com o bot já com o código de conexão.
  linkUrl?: string;
}

export interface EpisodePosition {
  temporada: number;
  episodio: number;
}

// Um episódio com a data de exibição, só o dia ('2026-10-16'): ver parseAirDate.
export interface AiringEpisode extends EpisodePosition {
  dataExibicao: string | null;
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
