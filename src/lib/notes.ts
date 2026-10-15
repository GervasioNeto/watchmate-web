import type { NoteFields } from '@/types/api';

// Mesmo limite da API. Conta como o `maxLength` do navegador (unidades UTF-16).
export const NOTE_MAX_LENGTH = 80;

// O recado que cada um deixa para o par: uma frase curta, trocada quando a pessoa quiser.
export interface Note {
  text: string;
  at: Date;
}

export function toNote(fields: NoteFields): Note | null {
  return fields.recado && fields.recadoEm
    ? { text: fields.recado, at: new Date(fields.recadoEm) }
    : null;
}

// Igual à API: o recado é uma linha só, sem espaços sobrando.
export function normalizeNote(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
