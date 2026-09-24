const STATUS_LABELS: Record<string, string> = {
  'Returning Series': 'Em exibição',
  Ended: 'Finalizada',
  Canceled: 'Cancelada',
  'In Production': 'Em produção',
  Planned: 'Planejada',
  Pilot: 'Piloto',
};

export function StatusLabel({ status }: { status: string | null }) {
  if (!status) return null;
  return <>{STATUS_LABELS[status] ?? status}</>;
}
