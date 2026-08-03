import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { credentialsReceived, selectIsAuthenticated } from '../features/auth/authSlice';
import { useLoginMutation, useLogoutMutation } from '../features/auth/auth.api';
import { errorMessage } from '../lib/format';

const schema = z.object({
  identifier: z.string().trim().min(1, 'Identifiant requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const REMEMBER_KEY = 'lartis.admin.rememberIdentifier';

function isLikelyValidIdentifier(value) {
  const v = value.trim();
  if (!v) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return true;
  return v.replace(/\D/g, '').length >= 8;
}

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [login, { isLoading }] = useLoginMutation();
  const [logout] = useLogoutMutation();
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem(REMEMBER_KEY)));

  const remembered = localStorage.getItem(REMEMBER_KEY) || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { identifier: remembered, password: '' },
  });

  const identifierValue = watch('identifier');
  const identifierValid = useMemo(
    () => isLikelyValidIdentifier(identifierValue || ''),
    [identifierValue]
  );

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname ?? '/'} replace />;
  }

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const session = await login(values).unwrap();

      // Le serveur authentifie tous les rôles sur ce même endpoint : c'est
      // ici qu'on refuse l'entrée aux comptes non administrateurs, en
      // révoquant au passage la session que le serveur vient d'ouvrir.
      if (session.user?.role !== 'admin') {
        await logout().catch(() => {});
        setFormError("Ce compte n'a pas accès à l'administration.");
        return;
      }

      if (rememberMe) localStorage.setItem(REMEMBER_KEY, values.identifier.trim());
      else localStorage.removeItem(REMEMBER_KEY);

      dispatch(credentialsReceived(session));
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (error) {
      setFormError(errorMessage(error, 'Connexion impossible.'));
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Panneau marque — desktop */}
      <aside className="relative hidden w-[46%] overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-[#061525] via-[#0B1F3A] to-[#020617]" />
        <div className="login-map absolute inset-0 opacity-30" aria-hidden="true" />
        <div
          className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -right-16 top-24 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl"
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg shadow-black/30">
              <img src="/logo.png" alt="" className="h-full w-full object-contain" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">L-ARTIS</p>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-300/90">
                Bénin
              </p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              Espace d&apos;administration
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Pilotez artisans, catégories, avis et utilisateurs depuis un tableau de bord
              sécurisé.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-brand-400" aria-hidden="true" />
                Accès réservé aux administrateurs
              </li>
              <li className="flex items-center gap-2.5">
                <Lock className="size-4 text-brand-400" aria-hidden="true" />
                Session chiffrée et limitée dans le temps
              </li>
            </ul>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} L-ARTIS — Tous droits réservés.
          </p>
        </motion.div>
      </aside>

      {/* Formulaire */}
      <main className="relative flex flex-1 flex-col">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" aria-hidden="true" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-24"
        >
          {/* En-tête mobile */}
          <div className="mb-10 flex flex-col items-center text-center lg:hidden">
            <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-slate-200">
              <img src="/logo.png" alt="L-ARTIS" className="h-full w-full object-contain" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Administration</h1>
            <p className="mt-1 text-sm text-slate-500">L-ARTIS — Bénin</p>
          </div>

          <div className="mx-auto w-full max-w-[400px]">
            <div className="mb-8 hidden lg:block">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
                Connexion
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Bienvenue
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Connectez-vous pour gérer la plateforme.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              <AnimatePresence>
                {formError ? (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {formError}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              <div>
                <label htmlFor="admin-identifier" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Identifiant
                </label>
                <div className="relative">
                  <UserRound
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="admin-identifier"
                    autoComplete="username"
                    placeholder="Entrez votre email"
                    aria-invalid={Boolean(errors.identifier)}
                    aria-describedby={errors.identifier ? 'admin-identifier-error' : undefined}
                    className="block w-full rounded-xl border-0 bg-white py-3 pl-11 pr-10 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-brand-600"
                    {...register('identifier')}
                  />
                  {identifierValid && !errors.identifier ? (
                    <CheckCircle2
                      className="absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-brand-600"
                      aria-label="Identifiant valide"
                    />
                  ) : null}
                </div>
                {errors.identifier ? (
                  <span id="admin-identifier-error" className="mt-1.5 block text-xs text-red-600">
                    {errors.identifier.message}
                  </span>
                ) : null}
              </div>

              <div>
                <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'admin-password-error' : undefined}
                    className="block w-full rounded-xl border-0 bg-white py-3 pl-11 pr-11 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-brand-600"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <span id="admin-password-error" className="mt-1.5 block text-xs text-red-600">
                    {errors.password.message}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="inline-flex cursor-pointer items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                  />
                  <span className="text-slate-600">Se souvenir de moi</span>
                </label>
                <button
                  type="button"
                  className="font-medium text-brand-700 transition hover:text-brand-800 hover:underline"
                  onClick={() =>
                    setFormError(
                      'La réinitialisation admin se fait via un super-administrateur ou le support technique.'
                    )
                  }
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:scale-[1.01] hover:shadow-brand-600/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden="true"
                  />
                ) : (
                  <Lock className="size-4" aria-hidden="true" />
                )}
                {isLoading ? 'Connexion…' : 'Se connecter'}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500 lg:justify-start">
                <ShieldCheck className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                Accès réservé aux administrateurs de la plateforme.
              </p>
            </form>
          </div>
        </motion.div>

        <p className="relative z-10 px-6 pb-6 text-center text-xs text-slate-400 lg:hidden">
          © {new Date().getFullYear()} L-ARTIS — Tous droits réservés.
        </p>
      </main>
    </div>
  );
}
