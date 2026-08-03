import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { credentialsReceived, sessionEnded } from './authSlice';
import { useRefreshMutation } from './auth.api';
import { readRefreshToken } from '../../lib/secureSession';

/**
 * Restaure la session au lancement à partir du jeton conservé dans le
 * trousseau du téléphone.
 *
 * Le serveur fait tourner le refresh token à chaque usage et considère le
 * rejeu d'un ancien jeton comme un vol — il révoque alors TOUTES les sessions
 * de l'utilisateur. La garde ci-dessous empêche un double appel : en
 * développement, React monte les composants deux fois, et sans elle le second
 * appel présenterait le jeton déjà consommé, déconnectant l'utilisateur.
 */
export function useSessionBootstrap() {
  const dispatch = useDispatch();
  const [refresh] = useRefreshMutation();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    (async () => {
      const stored = await readRefreshToken();
      if (!stored) return dispatch(sessionEnded());

      try {
        dispatch(credentialsReceived(await refresh(stored).unwrap()));
      } catch {
        dispatch(sessionEnded());
      }
    })();
  }, [dispatch, refresh]);
}
