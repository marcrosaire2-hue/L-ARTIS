import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Home, LogOut, Menu, Search, User, X } from 'lucide-react';
import { selectUser, sessionEnded } from '../features/auth/authSlice';
import { useLogoutMutation } from '../features/auth/auth.api';
import { Button, Container } from './ui';
import { initials } from '../lib/format';

/* La navigation basse mobile : l'artisan comme le client sont sur téléphone. */
const MOBILE_NAV = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/recherche', label: 'Rechercher', icon: Search },
  { to: '/compte', label: 'Compte', icon: User },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src="/logo.png" alt="L-ARTIS" className="h-10 w-auto" />
      <span className="text-lg font-bold tracking-tight text-slate-900">L-ARTIS</span>
    </Link>
  );
}

function Header() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      /* déconnexion locale malgré tout */
    }
    dispatch(sessionEnded());
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink
            to="/recherche"
            className={({ isActive }) =>
              `text-sm font-medium ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'}`
            }
          >
            Trouver un artisan
          </NavLink>
          <NavLink
            to="/inscription?role=artisan"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Devenir artisan
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to={user.role === 'artisan' ? '/artisan' : '/compte'}
                className="hidden items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-100 sm:flex"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                  {initials(user)}
                </span>
                <span className="text-sm font-medium text-slate-700">{user.firstName}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600 sm:block"
                aria-label="Se déconnecter"
              >
                <LogOut className="size-5" aria-hidden="true" />
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/connexion">
                <Button variant="ghost" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link to="/inscription">
                <Button size="sm">Inscription</Button>
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white sm:hidden">
          <Container className="flex flex-col gap-1 py-3">
            <Link to="/recherche" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Trouver un artisan
            </Link>
            <Link to="/inscription?role=artisan" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Devenir artisan
            </Link>
            {user ? (
              <button type="button" onClick={handleLogout} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                Se déconnecter
              </button>
            ) : (
              <>
                <Link to="/connexion" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Connexion
                </Link>
                <Link to="/inscription" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
                  Créer un compte
                </Link>
              </>
            )}
          </Container>
        </div>
      )}
    </header>
  );
}

function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white md:hidden">
      <div className="grid grid-cols-3">
        {MOBILE_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-xs ${
                isActive ? 'text-brand-700' : 'text-slate-500'
              }`
            }
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <Container className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            La plateforme qui met en relation les artisans du Bénin et leurs clients.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          <Link to="/recherche" className="hover:text-slate-900">
            Trouver un artisan
          </Link>
          <Link to="/inscription?role=artisan" className="hover:text-slate-900">
            Devenir artisan
          </Link>
          <Link to="/mentions-legales" className="hover:text-slate-900">
            Mentions légales
          </Link>
          <Link to="/reglement/client" className="hover:text-slate-900">
            Règlement clients
          </Link>
          <Link to="/reglement/artisan" className="hover:text-slate-900">
            Règlement artisans
          </Link>
        </nav>
      </Container>
    </footer>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
