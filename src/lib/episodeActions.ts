import type { EpisodeWatcher, ProgressScope, SeriesProgress, WatchMode } from '@/types/api';
import type { EpisodeWatchStatus } from '@/lib/progress';

export interface ProgressChoice {
  label: string;
  watched: boolean;
  scope: ProgressScope;
  destructive?: boolean;
}

interface ActionContext {
  meId: string;
  // Primeiro nome do par, ou null quando ninguém entrou no grupo ainda.
  partnerName: string | null;
  mode: WatchMode;
}

// A API só apaga o progresso do parceiro quando foi você quem marcou ou quando foi
// marcado "juntos". O que ele marcou sozinho continua dele.
function canRemoveForPartner(watcher: EpisodeWatcher, meId: string): boolean {
  return watcher.juntos || watcher.marcadoPor === meId;
}

export interface QuickToggle {
  checked: boolean;
  watched: boolean;
  scope: ProgressScope;
}

// O botão de check da linha do episódio. No modo JUNTOS ele representa "os dois
// viram"; no SEPARADOS (ou sem par), "eu vi".
export function getEpisodeQuickToggle(
  status: EpisodeWatchStatus,
  { partnerName, mode }: ActionContext,
): QuickToggle {
  if (partnerName && mode === 'JUNTOS') {
    const checked = !!status.me && !!status.partner;
    return { checked, watched: !checked, scope: 'both' };
  }
  const checked = !!status.me;
  return { checked, watched: !checked, scope: 'me' };
}

export function getEpisodeChoices(
  status: EpisodeWatchStatus,
  { meId, partnerName }: ActionContext,
): ProgressChoice[] {
  const { me, partner } = status;

  if (!partnerName) {
    return me
      ? [{ label: 'Desmarcar', watched: false, scope: 'me', destructive: true }]
      : [{ label: 'Marcar como assistido', watched: true, scope: 'me' }];
  }

  const choices: ProgressChoice[] = [];
  if (!me && !partner) {
    choices.push({ label: 'Assistimos juntos', watched: true, scope: 'both' });
    choices.push({ label: 'Só eu assisti', watched: true, scope: 'me' });
  }
  if (me && !partner) {
    choices.push({ label: `${partnerName} também assistiu`, watched: true, scope: 'both' });
  }
  if (!me && partner) {
    choices.push({ label: 'Eu também assisti', watched: true, scope: 'me' });
  }
  if (me) {
    choices.push({ label: 'Desmarcar pra mim', watched: false, scope: 'me', destructive: true });
  }
  if (partner && canRemoveForPartner(partner, meId)) {
    choices.push({
      label: me ? 'Desmarcar pros dois' : `Desmarcar pra ${partnerName}`,
      watched: false,
      scope: 'both',
      destructive: true,
    });
  }
  return choices;
}

export interface SeasonStatus {
  total: number;
  mine: number;
  partners: number;
  // Episódios do par nessa temporada que você tem permissão de desmarcar.
  partnersRemovable: number;
}

export function getSeasonStatus(
  progress: SeriesProgress,
  season: number,
  total: number,
  meId: string,
  partnerId: string | null,
): SeasonStatus {
  let mine = 0;
  let partners = 0;
  let partnersRemovable = 0;
  for (const entry of progress.episodios) {
    if (entry.temporada !== season) continue;
    for (const watcher of entry.assistidoPor) {
      if (watcher.usuarioId === meId) mine++;
      if (partnerId && watcher.usuarioId === partnerId) {
        partners++;
        if (canRemoveForPartner(watcher, meId)) partnersRemovable++;
      }
    }
  }
  return { total, mine, partners, partnersRemovable };
}

export function getSeasonChoices(
  status: SeasonStatus,
  { partnerName }: ActionContext,
): ProgressChoice[] {
  const meComplete = status.total > 0 && status.mine >= status.total;
  const partnerComplete = status.total > 0 && status.partners >= status.total;

  if (!partnerName) {
    const choices: ProgressChoice[] = [];
    if (!meComplete) {
      choices.push({ label: 'Marcar a temporada inteira', watched: true, scope: 'me' });
    }
    if (status.mine > 0) {
      choices.push({
        label: 'Desmarcar a temporada',
        watched: false,
        scope: 'me',
        destructive: true,
      });
    }
    return choices;
  }

  const choices: ProgressChoice[] = [];
  if (!meComplete || !partnerComplete) {
    choices.push({ label: 'Assistimos a temporada juntos', watched: true, scope: 'both' });
  }
  if (!meComplete) {
    choices.push({ label: 'Eu assisti a temporada inteira', watched: true, scope: 'me' });
  }
  if (status.mine > 0) {
    choices.push({
      label: 'Desmarcar a temporada pra mim',
      watched: false,
      scope: 'me',
      destructive: true,
    });
  }
  if (status.partnersRemovable > 0) {
    choices.push({
      label: status.mine > 0 ? 'Desmarcar a temporada pros dois' : `Desmarcar pra ${partnerName}`,
      watched: false,
      scope: 'both',
      destructive: true,
    });
  }
  return choices;
}
