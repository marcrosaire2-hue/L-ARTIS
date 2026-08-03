import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Moon,
  Shield,
  Sun,
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
  const digits = v.replace(/\D/g, '');
  return digits.length >= 8;
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
  const [theme, setTheme] = useState('dark');

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

  useEffect(() => {
    document.documentElement.dataset.loginTheme = theme;
    return () => {
      delete document.documentElement.dataset.loginTheme;
    };
  }, [theme]);

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

  const light = theme === 'light';

  return (
    <div
      className={`relative flex min-h-screen flex-col overflow-hidden ${
        light
          ? 'bg-gradient-to-br from-slate-100 via-sky-50 to-slate-200 text-slate-900'
          : 'bg-[#020617] text-white'
      }`}
    >
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {!light && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0b1f3a_0%,_#020617_55%,_#000000_100%)]" />
            <div className="login-map absolute inset-0 opacity-[0.22]" />
            <div className="login-orbit login-orbit-a absolute left-1/2 top-[42%] size-[min(90vw,52rem)]" />
            <div className="login-orbit login-orbit-b absolute left-1/2 top-[42%] size-[min(70vw,38rem)]" />
            <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
            <div className="absolute -right-16 top-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="absolute bottom-32 left-10 h-40 w-56 rounded-[40%] bg-blue-500/15 blur-2xl" />
          </>
        )}
        {light && (
          <>
            <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl" />
            <div className="absolute -right-10 top-20 h-56 w-56 rounded-full bg-sky-300/40 blur-3xl" />
          </>
        )}
        <div className="absolute left-5 top-5 grid grid-cols-3 gap-1.5 opacity-40">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className={`size-1 rounded-full ${light ? 'bg-slate-400' : 'bg-slate-500'}`} />
          ))}
        </div>
      </div>

      {/* Top controls */}
      <div className="relative z-10 flex items-center justify-end gap-3 px-4 pb-2 pt-4 sm:px-8">
        <div
          className={`inline-flex items-center gap-1 rounded-full p-1 ring-1 backdrop-blur-md ${
            light ? 'bg-white/70 ring-slate-200' : 'bg-white/5 ring-white/15'
          }`}
          role="group"
          aria-label="Thème d'affichage"
        >
          <button
            type="button"
            onClick={() => setTheme('light')}
            aria-pressed={light}
            aria-label="Thème clair"
            className={`rounded-full p-2 transition ${
              light ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            aria-pressed={!light}
            aria-label="Thème sombre"
            className={`rounded-full p-2 transition ${
              !light ? 'bg-white/10 text-sky-300' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Moon className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm backdrop-blur-md ring-1 ${
            light
              ? 'bg-white/70 text-slate-700 ring-slate-200'
              : 'bg-white/5 text-slate-200 ring-white/15'
          }`}
        >
          <span>Français</span>
          <ChevronDown className="size-3.5 opacity-70" aria-hidden="true" />
          <span className="sr-only">Sélecteur de langue (Français uniquement pour l’instant)</span>
        </div>
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-4"
      >
        <div className="mb-7 flex w-full max-w-[400px] flex-col items-center text-center">
          <span
            className={`mb-4 flex size-[4.5rem] items-center justify-center rounded-2xl p-2 shadow-xl ring-1 ${
              light
                ? 'bg-white shadow-slate-300/50 ring-slate-200'
                : 'bg-white/95 shadow-black/40 ring-white/20'
            }`}
          >
            <img src="/logo.png" alt="L-ARTIS" className="h-full w-full object-contain" />
          </span>
          <h1 className={`text-3xl font-bold tracking-tight ${light ? 'text-slate-900' : 'text-white'}`}>
            Administration
          </h1>
          <p className={`mt-1.5 text-sm font-medium ${light ? 'text-sky-700' : 'text-sky-300'}`}>
            <span className={light ? 'text-slate-500' : 'text-slate-400'}>L-ARTIS</span>
            {' — '}
            Bénin
          </p>
          <p className={`mt-3 max-w-sm text-sm leading-relaxed ${light ? 'text-slate-600' : 'text-slate-400'}`}>
            Connectez-vous à votre espace d&apos;administration pour gérer la plateforme.
          </p>
        </div>

        <div
          className={`w-full max-w-[400px] rounded-2xl p-6 shadow-2xl backdrop-blur-xl sm:p-8 ${
            light
              ? 'bg-white/75 ring-1 ring-slate-200/80 shadow-slate-300/40'
              : 'bg-[rgba(10,22,45,0.55)] ring-1 ring-sky-400/30 shadow-[0_0_40px_-10px_rgba(56,189,248,0.35)]'
          }`}
        >
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <AnimatePresence>
              {formError ? (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ring-1 ring-inset ${
                    light
                      ? 'bg-red-50 text-red-700 ring-red-200'
                      : 'bg-red-500/10 text-red-200 ring-red-400/30'
                  }`}
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {formError}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <div>
              <label
                htmlFor="admin-identifier"
                className={`mb-1.5 block text-sm font-medium ${light ? 'text-slate-700' : 'text-slate-100'}`}
              >
                Identifiant
              </label>
              <div className="relative">
                <UserRound
                  className={`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 ${
                    light ? 'text-slate-400' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <input
                  id="admin-identifier"
                  autoComplete="username"
                  placeholder="Entrez votre email"
                  aria-invalid={Boolean(errors.identifier)}
                  aria-describedby={errors.identifier ? 'admin-identifier-error' : undefined}
                  className={`block w-full rounded-xl border-0 py-3 pl-10 pr-10 text-sm outline-none transition ring-1 ring-inset placeholder:text-slate-500 focus:ring-2 ${
                    light
                      ? 'bg-white text-slate-900 ring-slate-300 focus:ring-brand-500'
                      : 'bg-white/5 text-white ring-white/15 focus:ring-sky-400/70 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]'
                  }`}
                  {...register('identifier')}
                />
                {identifierValid && !errors.identifier ? (
                  <CheckCircle2
                    className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-brand-500"
                    aria-label="Identifiant valide"
                  />
                ) : null}
              </div>
              {errors.identifier ? (
                <span id="admin-identifier-error" className="mt-1.5 block text-xs text-red-400">
                  {errors.identifier.message}
                </span>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className={`mb-1.5 block text-sm font-medium ${light ? 'text-slate-700' : 'text-slate-100'}`}
              >
                Mot de passe
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'admin-password-error' : undefined}
                  className={`block w-full rounded-xl border-0 py-3 pl-10 pr-11 text-sm outline-none transition ring-1 ring-inset placeholder:text-slate-500 focus:ring-2 ${
                    light
                      ? 'bg-white text-slate-900 ring-slate-300 focus:ring-brand-500'
                      : 'bg-white/5 text-white ring-white/15 focus:ring-sky-400/70 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition ${
                    light ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
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
                <span id="admin-password-error" className="mt-1.5 block text-xs text-red-400">
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
                  className="size-4 rounded border-slate-400 text-brand-600 focus:ring-brand-500"
                />
                <span className={light ? 'text-slate-700' : 'text-slate-200'}>Se souvenir de moi</span>
              </label>
              <button
                type="button"
                className={`font-medium transition hover:underline ${
                  light ? 'text-sky-700' : 'text-sky-300'
                }`}
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
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-400 via-brand-500 to-brand-700 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(16,185,129,0.65)] transition duration-200 hover:scale-[1.02] hover:shadow-[0_14px_36px_-8px_rgba(16,185,129,0.8)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
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

            <p
              className={`flex items-center justify-center gap-1.5 text-center text-xs ${
                light ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <Shield className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
              Accès réservé aux administrateurs de la plateforme.
            </p>
          </form>
        </div>
      </motion.main>

      <footer
        className={`relative z-10 pb-5 text-center text-xs ${
          light ? 'text-slate-500' : 'text-slate-500'
        }`}
      >
        © {new Date().getFullYear()} L-ARTIS — Tous droits réservés.
      </footer>
    </div>
  );
}
