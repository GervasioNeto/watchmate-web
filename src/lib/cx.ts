// Junta classes ignorando valores falsos. Não resolve conflitos entre utilitários:
// o `className` recebido pelos componentes de ui/ é só para layout (margem, largura).
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
