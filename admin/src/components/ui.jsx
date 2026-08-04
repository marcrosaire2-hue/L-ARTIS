import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useId } from 'react';
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { ROLES, initials } from '../lib/format';

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

const TONES = {
  green: 'bg-brand-100 text-brand-800 ring-brand-600/20',
  amber: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  red: 'bg-red-100 text-red-800 ring-red-600/20',
  blue: 'bg-sky-100 text-sky-800 ring-sky-600/20',
  purple: 'bg-violet-100 text-violet-800 ring-violet-600/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
};

export function Badge({ tone = 'slate', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONES[tone] ?? TONES.slate} ${className}`}
    >
      {children}
    </span>
  );
}

/** Badge piloté par une table de libellés (ARTISAN_STATUS, ROLES…). */
export function StatusBadge({ value, map }) {
  const entry = map[value];
  return <Badge tone={entry?.tone ?? 'slate'}>{entry?.label ?? value ?? '—'}</Badge>;
}

/** Badge de rôle normalisé (client, artisan, administrateur). */
export function RoleBadge({ role }) {
  return <StatusBadge value={role} map={ROLES} />;
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

const AVATAR_SIZES = {
  sm: 'size-8 text-[10px]',
  md: 'size-10 text-xs',
  lg: 'size-12 text-sm',
};

const AVATAR_TONES = {
  slate: 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 ring-slate-200/60',
  brand: 'bg-gradient-to-br from-brand-100 to-brand-50 text-brand-700 ring-brand-600/10',
};

/** Avatar à initiales, dérivé du vrai nom de l'utilisateur. */
export function Avatar({ user, size = 'md', tone = 'slate', className = '' }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ${AVATAR_SIZES[size]} ${AVATAR_TONES[tone]} ${className}`}
    >
      {initials(user)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Bouton                                                              */
/* ------------------------------------------------------------------ */

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
  secondary:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-300',
};

const SIZES = {
  sm: 'px-3 py-2 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-control font-medium transition-colors duration-base disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Carte & entêtes                                                     */
/* ------------------------------------------------------------------ */

export function Card({ className = '', children }) {
  return (
    <div className={`rounded-card bg-white shadow-card ring-1 ring-slate-200 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, description, actions, icon: Icon }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        {Icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 sm:size-12">
            <Icon className="size-5 sm:size-6" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-slate-500 sm:mt-1.5">{description}</p>
          )}
        </div>
      </div>
      {actions ? <div className="w-full sm:w-auto">{actions}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* États                                                               */
/* ------------------------------------------------------------------ */

export function Spinner({ className = '' }) {
  return (
    <Loader2
      className={`size-5 animate-spin text-brand-600 ${className}`}
      role="status"
      aria-label="Chargement"
    />
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  const gradientId = useId();
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <span className="relative flex size-24 items-center justify-center">
        <svg viewBox="0 0 96 96" className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ECFDF5" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
          </defs>
          <circle cx="48" cy="48" r="44" fill={`url(#${gradientId})`} />
          <circle
            cx="48"
            cy="48"
            r="34"
            fill="none"
            stroke="#D1FAE5"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
        </svg>
        {Icon && <Icon className="relative size-8 text-brand-600/70" aria-hidden="true" />}
      </span>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Champs de formulaire                                                */
/* ------------------------------------------------------------------ */

const FIELD_BASE =
  'block w-full rounded-control border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 disabled:bg-slate-50';

export function Field({ label, error, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      {children}
      {error && <span className="mt-1.5 block text-xs text-red-600">{error}</span>}
      {!error && hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`${FIELD_BASE} ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${FIELD_BASE} ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${FIELD_BASE} pr-8 ${className}`} {...props}>
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Tableau                                                             */
/* ------------------------------------------------------------------ */

/**
 * Tableau desktop + liste cartes mobile.
 * `mobile` : contenu rendu sous `md` (cartes). Sans `mobile`, le tableau
 * reste scrollable horizontalement partout.
 */
export function DataTable({ headers, children, mobile }) {
  return (
    <>
      {mobile ? (
        <div className="divide-y divide-slate-100 md:hidden">{mobile}</div>
      ) : null}
      <div className={`overflow-x-auto ${mobile ? 'hidden md:block' : ''}`}>
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80">
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key ?? header.label}
                  scope="col"
                  className={`px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:px-5 ${header.className ?? ''}`}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </>
  );
}

/** Carte d'une ligne de liste (vue mobile). */
export function ListCard({ children, className = '' }) {
  return <article className={`flex flex-col gap-3 p-4 ${className}`}>{children}</article>;
}

/** Numéros de pages fenêtrés : 1 … (page-1 page page+1) … total. */
function getPageItems(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const items = [1];
  if (page > 3) items.push(null);
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p += 1) {
    items.push(p);
  }
  if (page < totalPages - 2) items.push(null);
  items.push(totalPages);
  return items;
}

export function Pagination({ page, totalPages, totalItems, onChange }) {
  if (!totalItems) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-5">
      <p className="text-center text-sm text-slate-500 sm:text-left">
        Page {page}/{totalPages}
        <span className="text-slate-300"> · </span>
        {totalItems} résultat{totalItems > 1 ? 's' : ''}
      </p>
      <div className="flex items-center justify-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Page précédente"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Précédent</span>
        </Button>
        <div className="hidden items-center gap-1.5 sm:flex">
          {getPageItems(page, totalPages).map((item, index) =>
            item === null ? (
              <span key={`gap-${index}`} className="px-1 text-sm text-slate-400">
                …
              </span>
            ) : (
              <Button
                key={item}
                size="sm"
                variant={item === page ? 'primary' : 'secondary'}
                className="min-w-9 justify-center px-2"
                onClick={() => onChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </Button>
            )
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Page suivante"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modale                                                              */
/* ------------------------------------------------------------------ */

export function Modal({ open, onClose, title, description, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="flex max-h-[min(92vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-panel bg-white shadow-pop"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fermer"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
