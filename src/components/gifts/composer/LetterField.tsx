import { LetterPaper } from '@/components/gifts/LetterPaper';
import { MESSAGE_MAX_LENGTH, type WrapTheme } from '@/lib/gifts';
import type { GiftOccasion } from '@/types/api';

const PLACEHOLDERS: Record<GiftOccasion, string> = {
  anniversary: 'Mais um ano do nosso lado do sofá…',
  valentines: 'Meu par favorito…',
  'just-because': 'Só passei pra dizer…',
};

interface LetterFieldProps {
  id: string;
  value: string;
  onChange: (message: string) => void;
  occasion: GiftOccasion;
  wrap: WrapTheme;
  to: string;
  from: string;
}

// Escrever a carta direto no papel em que ela chega: o selo na cor do embrulho, "Pra Leila,"
// em cima e a sua assinatura embaixo. O campo cresce com o texto.
export function LetterField({ id, value, onChange, occasion, wrap, to, from }: LetterFieldProps) {
  return (
    <LetterPaper
      wrap={wrap}
      salutation={`Pra ${to},`}
      signature={from}
      footnote={`${value.length}/${MESSAGE_MAX_LENGTH}`}
      className="transition-[outline-color] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--gift-paper)"
    >
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MESSAGE_MAX_LENGTH}
        rows={4}
        placeholder={PLACEHOLDERS[occasion]}
        className="block min-h-28 w-full resize-none bg-transparent text-[17px] leading-relaxed font-medium text-on-note [field-sizing:content] placeholder:text-on-note/35 focus:outline-none"
      />
    </LetterPaper>
  );
}
