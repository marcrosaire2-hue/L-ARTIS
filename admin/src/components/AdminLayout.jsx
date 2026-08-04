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
      {/* Desktop : rail sticky plein viewport */}
      <div className="hidden shrink-0 lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-[min(18rem,85vw)] max-w-xs shadow-2xl">
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
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <img src="/logo.png" alt="" className="size-7 object-contain" />
              <span className="truncate text-sm font-bold tracking-tight text-slate-900">
                L-ARTIS
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{fullName(user)}</p>
              <p className="max-w-[14rem] truncate text-xs text-slate-500">{user?.email}</p>
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

        <main className="flex-1 bg-surface p-3 sm:p-6 lg:p-8">
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
