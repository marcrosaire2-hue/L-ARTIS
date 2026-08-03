import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  credentialsReceived,
  selectIsAuthenticated,
  selectIsRestoring,
  sessionEnded,
} from './features/auth/authSlice';
import { useRefreshMutation } from './features/auth/auth.api';
import AdminLayout from './components/AdminLayout';
import { Spinner } from './components/ui';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ArtisansPage from './pages/ArtisansPage';
import UsersPage from './pages/UsersPage';
import ReviewsPage from './pages/ReviewsPage';
import CatalogPage from './pages/CatalogPage';

/**
 * Le serveur fait tourner le refresh token à chaque usage et considère la
 * réutilisation d'un ancien token comme un vol — il révoque alors TOUTES les
 * sessions. Ce drapeau au niveau du module empêche le double montage de
 * React StrictMode de déclencher deux refresh concurrents, dont le second
 * enverrait l'ancien cookie et déconnecterait l'administrateur.
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
      .then((session) => {
        // Le cookie de session est porté par l'hôte, pas par le port : une
        // connexion sur le site client (même machine, autre port) est donc
        // visible ici. Sans ce contrôle, un compte client ou artisan ouvrirait
        // l'interface d'administration — l'API répondrait 403 sur chaque
        // appel, mais l'écran n'aurait jamais dû s'afficher.
        if (session.user?.role !== 'admin') {
          dispatch(sessionEnded());
          return;
        }
        dispatch(credentialsReceived(session));
      })
      .catch(() => dispatch(sessionEnded()));
  }, [dispatch, refresh]);
}

function RequireAuth({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  useRestoreSession();
  const isRestoring = useSelector(selectIsRestoring);

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/connexion" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="artisans" element={<ArtisansPage />} />
        <Route path="utilisateurs" element={<UsersPage />} />
        <Route path="avis" element={<ReviewsPage />} />
        <Route path="catalogue" element={<CatalogPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
