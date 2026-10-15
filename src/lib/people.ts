import { isAvatarStyle, type AvatarStyleId } from '@/lib/avatarStyles';
import { DEFAULT_TONES, isPersonTone, PERSON_TONES, type PersonTone } from '@/lib/personTone';
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

// A cor de cada um é a que escolheu no perfil (a API garante que os dois não repitam).
// Por segurança, uma cor guardada que não está na paleta (uma que saiu do app) ou que
// repete a de quem entrou antes cai na primeira cor padrão livre. A ordem de entrada, com
// o id desempatando, faz os dois celulares chegarem sempre no mesmo resultado.
function toneByMember(members: GroupMemberSummary[]): (userId: string) => PersonTone {
  const ordered = [...members].sort(
    (a, b) => a.entrouEm.localeCompare(b.entrouEm) || a.usuario.id.localeCompare(b.usuario.id),
  );
  const tones = new Map<string, PersonTone>();
  for (const member of ordered) {
    const taken = new Set(tones.values());
    const fallback = [...DEFAULT_TONES, ...PERSON_TONES].find((tone) => !taken.has(tone));
    tones.set(
      member.usuario.id,
      isPersonTone(member.cor) && !taken.has(member.cor)
        ? member.cor
        : (fallback ?? DEFAULT_TONES[0]),
    );
  }
  return (userId) => tones.get(userId) ?? DEFAULT_TONES[0];
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
  const toneOf = toneByMember(members);

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
