import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, Menu, X } from 'lucide-react';
import { selectUser, sessionEnded } from '../features/auth/authSlice';
import { useLogoutMutation } from '../features/auth/auth.api';
import { fullName, initials } from '../lib/format';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    // La session locale est effacée même si l'appel échoue : sans access
    // token valide, le serveur ne peut de toute façon plus rien faire.
    try {
      await logout().unwrap();
    } catch {
      /* déconnexion locale malgré tout */
    }
    dispatch(sessionEnded());
    navigate('/connexion', { replace: true });
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* Barre latérale — fixe à partir de lg, tiroir en dessous */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-64">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 rounded-lg p-1.5 text-slate-400 transition-colors duration-base hover:bg-slate-800 hover:text-white"
              aria-label="Fermer le menu"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{fullName(user)}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white shadow-sm ring-2 ring-brand-100">
              {initials(user)}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading}
              className="rounded-lg p-2 text-slate-500 transition-colors duration-base hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut className="size-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="flex-1 bg-surface p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
            <footer className="mt-10 pb-2 text-center text-xs text-slate-400">
              © L-ARTIS — Tous droits réservés.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
