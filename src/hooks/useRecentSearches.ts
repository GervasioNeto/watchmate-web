import { useSyncExternalStore } from 'react';

// As últimas buscas, guardadas neste aparelho. Uma busca entra quando a pessoa a usa: abre
// ou adiciona um resultado, ou confirma no teclado. Digitar e apagar não conta.
const STORAGE_KEY = 'watchmate:buscas-recentes';
const MAX_SEARCHES = 8;
const EMPTY: string[] = [];

let cached: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (cached) return cached;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    cached = Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function write(searches: string[]) {
  cached = searches;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch {
    // Sem armazenamento: vale só até fechar a página.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRecentSearches() {
  const searches = useSyncExternalStore(subscribe, read, () => EMPTY);

  return {
    searches,
    // A mais recente vai para o começo; a mesma busca (sem diferença de maiúsculas) não repete.
    remember: (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      const others = read().filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      write([trimmed, ...others].slice(0, MAX_SEARCHES));
    },
    clear: () => write([]),
  };
}
