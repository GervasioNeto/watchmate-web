// O picote dos ingressos do app (o do perfil e o do "Bora?"): a linha tracejada e um "dente"
// em cada borda. Os dentes são círculos na cor do fundo da página que passam metade para
// fora do cartão, então o cartão não pode cortar o que sai dele (sem overflow-hidden).
export function TicketPerforation() {
  return (
    <div aria-hidden className="relative h-0">
      <span className="absolute inset-x-6 -top-px border-t-2 border-dashed border-line" />
      <span className="absolute top-0 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-canvas" />
      <span className="absolute top-0 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-canvas" />
    </div>
  );
}
