const STATUS_LABELS: Record<string, string> = {
  'Returning Series': 'Em exibição',
  Ended: 'Finalizada',
  Canceled: 'Cancelada',
  'In Production': 'Em produção',
  Planned: 'Planejada',
  Pilot: 'Piloto',
};

export function statusLabel(status: string | null): string | null {
  if (!status) return null;
  return STATUS_LABELS[status] ?? status;
}

// Série que ainda pode ganhar episódios. Sem status conhecido, conta como encerrada.
export function isOngoing(status: string | null): boolean {
  return !!status && status !== 'Ended' && status !== 'Canceled';
}
