import { useSearchParams } from 'react-router-dom';
import { addMonths, parseMonthKey, toMonthKey } from '@/lib/dates';

// O mês mostrado fica na URL (?mes=2026-09), como os filtros da lista: dá para voltar,
// recarregar e mandar o link. Sem o parâmetro (ou fora do intervalo), é o mês atual.
// `first` e `current` são o primeiro dia do mês.
export function useMonthParam(first: Date, current: Date) {
  const [params, setParams] = useSearchParams();
  const requested = parseMonthKey(params.get('mes'));
  const month = requested && requested >= first && requested <= current ? requested : current;

  // Trocar de mês não é ir para outra página: a tela fica onde está (ver useListFilters).
  const goTo = (target: Date) => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (target.getTime() === current.getTime()) next.delete('mes');
        else next.set('mes', toMonthKey(target));
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  };

  return {
    month,
    canGoBack: month > first,
    canGoForward: month < current,
    goBack: () => goTo(addMonths(month, -1)),
    goForward: () => goTo(addMonths(month, 1)),
  };
}
