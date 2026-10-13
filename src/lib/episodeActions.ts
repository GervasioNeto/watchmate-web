import type { EpisodeWatcher, ProgressScope, SeriesProgress } from '@/types/api';
import type { EpisodeWatchStatus } from '@/lib/progress';

export interface ProgressChoice {
  label: string;
  watched: boolean;
  scope: ProgressScope;
  // Só nas marcações para os dois: se assistiram juntos ou cada um em outro momento.
  together?: boolean;
  destructive?: boolean;
}

// O que uma marcação envia para a API.
export type ProgressChange = Pick<ProgressChoice, 'watched' | 'scope' | 'together'>;

interface ActionContext {
  meId: string;
  // Primeiro nome do par, ou null quando ninguém entrou no grupo ainda.
  partnerName: string | null;
}

// A API só apaga o progresso do parceiro quando foi você quem marcou ou quando foi
// marcado "juntos". O que ele marcou sozinho continua dele.
function canRemoveForPartner(watcher: EpisodeWatcher, meId: string): boolean {
  return watcher.juntos || watcher.marcadoPor === meId;
}

export interface QuickToggle {
  checked: boolean;
  watched: boolean;
}

// O check da linha do episódio é sempre seu: "eu vi". Ele não pergunta nada; quem
// viu junto ou em outro momento se resolve no ⋯ ou no botão "Assistimos juntos".
export function getEpisodeQuickToggle(status: EpisodeWatchStatus): QuickToggle {
  const checked = !!status.me;
  return { checked, watched: !checked };
}

// Opções do ⋯ de um episódio. A pergunta "viram juntos?" só aparece quando é ambígua:
// quando um dos dois já tinha marcado e o outro está sendo incluído agora.
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
    choices.push({ label: 'Assistimos juntos', watched: true, scope: 'both', together: true });
    choices.push({ label: 'Só eu assisti', watched: true, scope: 'me' });
  }

  if (me && !partner) {
    choices.push({
      label: `${partnerName} viu comigo`,
      watched: true,
      scope: 'both',
      together: true,
    });
    choices.push({
      label: `${partnerName} viu em outro momento`,
      watched: true,
      scope: 'both',
      together: false,
    });
  }

  if (!me && partner) {
    choices.push({
      label: `Vi junto com ${partnerName}`,
      watched: true,
      scope: 'both',
      together: true,
    });
    choices.push({ label: 'Vi em outro momento', watched: true, scope: 'me' });
  }

  // Os dois viram, mas não juntos: dá para corrigir.
  if (me && partner && !(me.juntos && partner.juntos)) {
    choices.push({ label: 'Vimos juntos', watched: true, scope: 'both', together: true });
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
    choices.push({
      label: 'Assistimos a temporada juntos',
      watched: true,
      scope: 'both',
      together: true,
    });
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
