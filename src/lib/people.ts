import type { Me } from '@/types/api';

export type PersonRole = 'me' | 'partner';

export interface Person {
  id: string;
  role: PersonRole;
  // Nome completo para exibir; nunca vazio.
  name: string;
  // Primeiro nome, para espaços curtos ("Larissa está 2 à frente").
  shortName: string;
  initial: string;
}

export interface Couple {
  me: Person | null;
  partner: Person | null;
  byId: (userId: string) => Person | null;
}

const PARTNER_FALLBACK = 'Seu par';
const ME_FALLBACK = 'Você';

export function displayName(
  user: { nome: string | null; email?: string | null },
  fallback: string,
): string {
  const nome = user.nome?.trim();
  if (nome) return nome;
  const emailName = user.email?.split('@')[0]?.trim();
  return emailName || fallback;
}

function toPerson(
  user: { id: string; nome: string | null; email?: string | null },
  role: PersonRole,
): Person {
  const name = displayName(user, role === 'me' ? ME_FALLBACK : PARTNER_FALLBACK);
  return {
    id: user.id,
    role,
    name,
    shortName: name.split(/\s+/)[0] ?? name,
    initial: name.charAt(0).toUpperCase(),
  };
}

export function buildCouple(me: Me | undefined): Couple {
  const mePerson = me ? toPerson(me, 'me') : null;
  const partnerUser = me
    ? me.membroDoGrupo?.grupo.membros.find((member) => member.usuario.id !== me.id)?.usuario
    : undefined;
  const partner = partnerUser ? toPerson(partnerUser, 'partner') : null;

  return {
    me: mePerson,
    partner,
    byId: (userId) => {
      if (mePerson?.id === userId) return mePerson;
      if (partner?.id === userId) return partner;
      return null;
    },
  };
}

// Como a pessoa aparece numa frase: "Você" para quem está usando o app.
export function subjectName(person: Person): string {
  return person.role === 'me' ? 'Você' : person.shortName;
}
