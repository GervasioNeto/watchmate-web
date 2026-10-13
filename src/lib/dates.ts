// Datas no fuso de quem está olhando: "hoje" e "este mês" são os do celular da pessoa.

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// "2026-10": como o mês aparece na URL.
export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function parseMonthKey(key: string | null): Date | null {
  const match = key?.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1) : null;
}

// "outubro de 2026"
export function formatMonth(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

// "agora", "há 5 min", "há 2 h", "ontem", "há 3 dias" e, depois de uma semana, a data.
export function formatTimeAgo(date: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000);
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}
