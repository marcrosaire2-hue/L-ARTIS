import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  credentialsReceived,
  selectIsAuthenticated,
  selectIsRestoring,
  selectUser,
  sessionEnded,
} from './features/auth/authSlice';
import { useRefreshMutation } from './features/auth/auth.api';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ArtisanPage from './pages/ArtisanPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PendingValidationPage from './pages/PendingValidationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AccountPage from './pages/AccountPage';
import ArtisanSpacePage from './pages/ArtisanSpacePage';
import QuotesPage from './pages/QuotesPage';
import QuoteDetailPage from './pages/QuoteDetailPage';
import NewQuotePage from './pages/NewQuotePage';
import FavoritesPage from './pages/FavoritesPage';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';
import MentionsLegalesPage from './pages/MentionsLegalesPage';
import ReglementPage from './pages/ReglementPage';
import SubscriptionPage from './pages/SubscriptionPage';

/**
 * Le serveur révoque toutes les sessions s'il voit un refresh token rejoué.
 * Ce drapeau de module empêche le double montage de StrictMode d'envoyer
 * deux refresh concurrents — le second porterait l'ancien cookie.
 */
let restoreAttempted = false;

function useRestoreSession() {
  const dispatch = useDispatch();
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    if (restoreAttempted) return;
    restoreAttempted = true;

    refresh()
      .unwrap()
      .then((session) => dispatch(credentialsReceived(session)))
      .catch(() => dispatch(sessionEnded()));
  }, [dispatch, refresh]);
}

function RequireAuth({ role, children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }
  if (role && user?.role !== role) {
    return <Navigate to="/compte" replace />;
  }
  if (!user?.termsAcceptedAt && user?.role !== 'admin') {
    const audience = user?.role === 'artisan' ? 'artisan' : 'client';
    return (
      <Navigate
        to={`/reglement/${audience}?accept=1`}
        state={{ from: location }}
        replace
      />
    );
  }
  return children;
}

export default function App() {
  useRestoreSession();
  const isRestoring = useSelector(selectIsRestoring);

  if (isRestoring) {
    return <Loading label="Chargement…" />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="recherche" element={<SearchPage />} />
        <Route path="artisans/:artisanId" element={<ArtisanPage />} />

        <Route path="connexion" element={<LoginPage />} />
        <Route path="inscription" element={<RegisterPage />} />
        <Route path="verification-email" element={<VerifyEmailPage />} />
        <Route
          path="attente-validation"
          element={
            <RequireAuth role="artisan">
              <PendingValidationPage />
            </RequireAuth>
          }
        />
        <Route path="mot-de-passe-oublie" element={<ForgotPasswordPage />} />
        <Route path="reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />

        <Route path="mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="reglement/:audience" element={<ReglementPage />} />

        <Route
          path="compte"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route
          path="artisan"
          element={
            <RequireAuth role="artisan">
              <ArtisanSpacePage />
            </RequireAuth>
          }
        />
        <Route
          path="devis"
          element={
            <RequireAuth>
              <QuotesPage />
            </RequireAuth>
          }
        />
        <Route
          path="devis/nouveau"
          element={
            <RequireAuth role="client">
              <NewQuotePage />
            </RequireAuth>
          }
        />
        <Route
          path="devis/:id"
          element={
            <RequireAuth>
              <QuoteDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="favoris"
          element={
            <RequireAuth role="client">
              <FavoritesPage />
            </RequireAuth>
          }
        />
        <Route
          path="notifications"
          element={
            <RequireAuth>
              <NotificationsPage />
            </RequireAuth>
          }
        />
        <Route
          path="messages"
          element={
            <RequireAuth>
              <MessagesPage />
            </RequireAuth>
          }
        />
        <Route
          path="abonnement"
          element={
            <RequireAuth role="artisan">
              <SubscriptionPage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
