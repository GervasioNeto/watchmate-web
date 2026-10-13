import { isAvatarStyle, type AvatarStyleId } from '@/lib/avatarStyles';
import type { PersonTone } from '@/lib/personTone';
import type { AvatarFields, GroupMemberSummary, Me } from '@/types/api';

// Como a pessoa é chamada ("Você" ou o nome). Depende de quem está olhando.
export type PersonRole = 'me' | 'partner';

export interface Person {
  id: string;
  role: PersonRole;
  // Cor da pessoa. Não depende de quem está olhando: é a mesma nos dois celulares.
  tone: PersonTone;
  // Nome completo para exibir; nunca vazio.
  name: string;
  // Primeiro nome, para espaços curtos ("Larissa está 2 à frente").
  shortName: string;
  initial: string;
  // Avatar do DiceBear escolhido no perfil; null desenha a inicial.
  avatar: { style: AvatarStyleId; seed: string } | null;
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

// Quem entrou primeiro no grupo (normalmente quem criou) fica com a cor `one`, o
// outro com `two`. O id desempata, para os dois celulares chegarem sempre no mesmo resultado.
function toneByJoinOrder(members: GroupMemberSummary[]): (userId: string) => PersonTone {
  const order = [...members]
    .sort(
      (a, b) => a.entrouEm.localeCompare(b.entrouEm) || a.usuario.id.localeCompare(b.usuario.id),
    )
    .map((member) => member.usuario.id);
  return (userId) => (order.indexOf(userId) === 1 ? 'two' : 'one');
}

function toPerson(
  user: AvatarFields & { id: string; nome: string | null; email?: string | null },
  role: PersonRole,
  tone: PersonTone,
): Person {
  const name = displayName(user, role === 'me' ? ME_FALLBACK : PARTNER_FALLBACK);
  // Estilos que o app não conhece mais (removidos do registro) caem na inicial.
  const avatar =
    isAvatarStyle(user.avatarEstilo) && user.avatarSemente
      ? { style: user.avatarEstilo, seed: user.avatarSemente }
      : null;
  return {
    id: user.id,
    role,
    tone,
    name,
    shortName: name.split(/\s+/)[0] ?? name,
    initial: name.charAt(0).toUpperCase(),
    avatar,
  };
}

export function buildCouple(me: Me | undefined): Couple {
  const members = me?.membroDoGrupo?.grupo.membros ?? [];
  const toneOf = toneByJoinOrder(members);

  const mePerson = me ? toPerson(me, 'me', toneOf(me.id)) : null;
  const partnerUser = me
    ? members.find((member) => member.usuario.id !== me.id)?.usuario
    : undefined;
  const partner = partnerUser ? toPerson(partnerUser, 'partner', toneOf(partnerUser.id)) : null;

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
