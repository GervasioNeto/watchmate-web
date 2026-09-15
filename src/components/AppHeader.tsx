import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Wordmark } from '@/components/Wordmark';
import { supabase } from '@/lib/supabase';

const NAV_LINKS = [
  { to: '/my-list', label: 'Minha lista' },
  { to: '/profile', label: 'Perfil' },
];

function desktopLinkClass({ isActive }: { isActive: boolean }) {
  return `text-sm ${isActive ? 'font-semibold text-white' : 'text-neutral-300 hover:text-white'}`;
}

function mobileLinkClass({ isActive }: { isActive: boolean }) {
  return `rounded-lg px-3 py-2.5 text-sm ${
    isActive ? 'bg-surface-raised text-white' : 'text-neutral-300 hover:bg-surface-raised hover:text-white'
  }`;
}

export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-surface-border bg-surface/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <NavLink to="/my-list" aria-label="Ir pra minha lista">
          <Wordmark />
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={desktopLinkClass}>
              {link.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-neutral-400 hover:text-white"
          >
            Sair
          </button>
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={`h-0.5 w-6 rounded-full bg-white transition-transform ${
              isMenuOpen ? 'translate-y-2 rotate-45' : ''
            }`}
          />
          <span
            className={`h-0.5 w-6 rounded-full bg-white transition-opacity ${
              isMenuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`h-0.5 w-6 rounded-full bg-white transition-transform ${
              isMenuOpen ? '-translate-y-2 -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-surface-border px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsMenuOpen(false)}
              className={mobileLinkClass}
            >
              {link.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              supabase.auth.signOut();
            }}
            className="rounded-lg px-3 py-2.5 text-left text-sm text-neutral-300 hover:bg-surface-raised hover:text-white"
          >
            Sair
          </button>
        </nav>
      )}
    </header>
  );
}
