import { NavLink } from 'react-router-dom';
import {
  Activity,
  Hammer,
  LayoutDashboard,
  Shield,
  ShieldCheck,
  Star,
  Tags,
  Users,
} from 'lucide-react';

/**
 * Barre latérale d'administration — référence de navigation officielle.
 * Composant purement visuel : les routes, l'état actif et la logique de
 * session restent gérés par NavLink et les éléments appelants.
 */
const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/artisans', label: 'Artisans', icon: Hammer },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/administrateurs', label: 'Administrateurs', icon: Shield },
  { to: '/tracabilite', label: 'Traçabilité', icon: Activity },
  { to: '/avis', label: 'Avis', icon: Star },
  { to: '/catalogue', label: 'Catalogue', icon: Tags },
];

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm">
        <img src="/logo.png" alt="L-ARTIS" className="h-full w-full object-contain" />
      </span>
      <p className="text-base font-bold tracking-tight text-white">L-ARTIS</p>
    </div>
  );
}

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1.5 px-4">
      <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        Navigation
      </p>
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={onNavigate}>
          {({ isActive }) => (
            <span
              className={`group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-base ease-standard ${
                isActive
                  ? 'bg-brand-600/15 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-500"
                />
              )}
              <Icon
                className={`size-5 shrink-0 transition-all duration-base ease-standard group-hover:translate-x-0.5 group-hover:scale-105 ${
                  isActive ? 'text-white' : 'group-hover:text-brand-400'
                }`}
                aria-hidden="true"
              />
              {label}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SecurityCard() {
  return (
    <div className="mx-4 mb-5 mt-auto rounded-card bg-slate-800/80 p-5 ring-1 ring-white/5">
      <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold text-white">Plateforme sécurisée</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">
        Connexions protégées et données chiffrées — accès strictement réservé aux administrateurs.
      </p>
    </div>
  );
}

export default function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full w-64 shrink-0 flex-col bg-gradient-to-b from-slate-900 to-slate-950">
      <Brand />
      <div aria-hidden="true" className="mx-5 border-b border-white/8" />
      <div className="flex-1 pt-4">
        <NavItems onNavigate={onNavigate} />
      </div>
      <SecurityCard />
    </div>
  );
}
