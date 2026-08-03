import { Loader2, Star } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Bouton                                                              */
/* ------------------------------------------------------------------ */

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
  accent: 'bg-accent-500 text-slate-900 hover:bg-accent-600 disabled:bg-accent-400/50',
  secondary:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

/**
 * Classes du bouton, exportées pour pouvoir habiller un <a>.
 * Imbriquer un <button> dans un <a> est du HTML invalide : l'élément interne
 * intercepte le clic et le lien ne s'active pas — c'est ce qui empêchait les
 * liens `tel:` de fonctionner. Un lien doit rester un lien.
 */
export function buttonClasses({ variant = 'primary', size = 'md', className = '' } = {}) {
  return `inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Lien d'action : même apparence qu'un bouton, comportement d'un lien. */
export function LinkButton({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <a className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Badge & note                                                        */
/* ------------------------------------------------------------------ */

const TONES = {
  green: 'bg-brand-100 text-brand-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  slate: 'bg-slate-100 text-slate-700',
  white: 'bg-white/90 text-slate-800 backdrop-blur',
};

export function Badge({ tone = 'slate', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Rating({ value = 0, count, size = 'sm' }) {
  const starSize = size === 'lg' ? 'size-5' : 'size-4';
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Note ${value} sur 5`}>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((index) => (
          <Star
            key={index}
            className={`${starSize} ${index <= Math.round(value) ? 'fill-accent-400 text-accent-400' : 'text-slate-300'}`}
            aria-hidden="true"
          />
        ))}
      </span>
      {count != null && (
        <span className="text-sm text-slate-500">
          {value ? value.toFixed(1) : '—'} ({count})
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Champs                                                              */
/* ------------------------------------------------------------------ */

const FIELD_BASE =
  'block w-full rounded-xl border-0 bg-white px-4 py-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 disabled:bg-slate-50';

export function Field({ label, error, hint, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-600">*</span>}
        </span>
      )}
      {children}
      {error && <span className="mt-1.5 block text-sm text-red-600">{error}</span>}
      {!error && hint && <span className="mt-1.5 block text-sm text-slate-500">{hint}</span>}
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
    <select className={`${FIELD_BASE} pr-10 ${className}`} {...props}>
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* États                                                               */
/* ------------------------------------------------------------------ */

export function Spinner({ className = '' }) {
  return (
    <Loader2
      className={`size-6 animate-spin text-brand-600 ${className}`}
      role="status"
      aria-label="Chargement"
    />
  );
}

export function Loading({ label = 'Chargement…' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20">
      <Spinner />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      {Icon && <Icon className="size-10 text-slate-300" aria-hidden="true" />}
      <p className="text-lg font-medium text-slate-800">{title}</p>
      {description && <p className="max-w-md text-slate-500">{description}</p>}
      {action}
    </div>
  );
}

export function Alert({ tone = 'red', children }) {
  const tones = {
    red: 'bg-red-50 text-red-800 ring-red-200',
    green: 'bg-brand-50 text-brand-800 ring-brand-200',
    amber: 'bg-amber-50 text-amber-900 ring-amber-200',
  };
  return (
    <p role="alert" className={`rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Mise en page                                                        */
/* ------------------------------------------------------------------ */

export function Container({ className = '', children }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function Card({ className = '', children }) {
  return (
    <div className={`rounded-2xl bg-white ring-1 ring-slate-200 ${className}`}>{children}</div>
  );
}
