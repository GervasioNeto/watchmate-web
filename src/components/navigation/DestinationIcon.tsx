import { useId } from 'react';
import { Search } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useCouple } from '@/hooks/useCouple';
import { cx } from '@/lib/cx';
import type { DestinationId } from '@/lib/destinations';
import { TONE_CLASSES } from '@/lib/personTone';

interface DestinationIconProps {
  id: DestinationId;
  active: boolean;
  size?: number;
}

// O ícone de cada destino. Apagados, são contornos na cor do texto; acesos, ganham
// preenchimento, como nos apps nativos. Dupla e Perfil são a dupla de verdade: as cores de
// vocês e o seu avatar.
export function DestinationIcon({ id, active, size = 24 }: DestinationIconProps) {
  switch (id) {
    case 'list':
      return <PostersIcon active={active} size={size} />;
    case 'search':
      return <Search size={size} strokeWidth={active ? 2.75 : 2} aria-hidden />;
    case 'couple':
      return <CoupleIcon active={active} size={size} />;
    case 'profile':
      return <ProfileIcon active={active} />;
  }
}

interface IconProps {
  active: boolean;
  size: number;
}

// Lista: dois pôsteres, um na frente do outro. Aceso, o da frente fica cheio.
function PostersIcon({ active, size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Do pôster de trás, só o pedaço que aparece por cima e à direita do da frente. */}
      <path d="M9 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3" />
      <rect x="4" y="7" width="11" height="14" rx="2" fill={active ? 'currentColor' : 'none'} />
    </svg>
  );
}

// Dupla: um círculo para cada um e, onde os dois se cruzam, o que é de vocês dois. Aceso,
// cada círculo pega a cor da pessoa e o cruzamento, o laranja do "juntos": a mesma regra de
// cor do calendário (ver DayDot). Sem par ainda, o lugar dele fica tracejado, como no
// CoupleAvatars.
function CoupleIcon({ active, size }: IconProps) {
  const { me, partner } = useCouple();
  const overlapId = useId();

  if (!active || !me) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <circle cx="9" cy="12" r="6" />
        <circle cx="15" cy="12" r="6" strokeDasharray={partner ? undefined : '2.6 2.6'} />
      </svg>
    );
  }

  const meCircle = (
    <circle cx="9" cy="12" r="6.5" fill="currentColor" className={TONE_CLASSES[me.tone].text} />
  );

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      {partner ? (
        <>
          <clipPath id={overlapId}>
            <circle cx="9" cy="12" r="6.5" />
          </clipPath>
          {meCircle}
          <circle
            cx="15"
            cy="12"
            r="6.5"
            fill="currentColor"
            className={TONE_CLASSES[partner.tone].text}
          />
          <circle
            cx="15"
            cy="12"
            r="6.5"
            fill="currentColor"
            clipPath={`url(#${overlapId})`}
            className="text-together"
          />
        </>
      ) : (
        <>
          <circle
            cx="15"
            cy="12"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="2.6 2.6"
          />
          {meCircle}
        </>
      )}
    </svg>
  );
}

// Perfil: o seu avatar. Aceso, ganha o anel na sua cor, como no topo do perfil.
function ProfileIcon({ active }: { active: boolean }) {
  const { me } = useCouple();
  return (
    <Avatar
      person={me}
      size="xs"
      className={
        active && me
          ? cx('ring-2 ring-offset-2 ring-offset-canvas', TONE_CLASSES[me.tone].ring)
          : undefined
      }
    />
  );
}
