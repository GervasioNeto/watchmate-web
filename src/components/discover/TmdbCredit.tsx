// O crédito que os termos do TMDB pedem (o logo oficial e o aviso) e o do JustWatch, de onde
// vêm os dados de onde assistir.
export function TmdbCredit() {
  return (
    <footer className="flex flex-col items-start gap-2.5 border-t border-line pt-5">
      <a
        href="https://www.themoviedb.org"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-sm"
      >
        <img src="/brand/tmdb.svg" alt="The Movie Database (TMDB)" className="h-3" />
      </a>
      <p className="max-w-prose text-xs leading-relaxed text-fg-subtle">
        Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB. Os dados de
        onde assistir são do JustWatch.
      </p>
    </footer>
  );
}
