import { createSlice } from '@reduxjs/toolkit';

/**
 * Session administrateur.
 *
 * L'access token est conservé UNIQUEMENT en mémoire : le stocker dans
 * localStorage l'exposerait à toute injection XSS. La persistance entre
 * rechargements est assurée par le cookie httpOnly de refresh, rejoué au
 * démarrage par `useRestoreSession`.
 */
const initialState = {
  user: null,
  accessToken: null,
  // 'restoring' tant que la tentative de refresh initiale n'a pas abouti
  status: 'restoring',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    credentialsReceived(state, action) {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.status = 'authenticated';
    },
    sessionEnded(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'anonymous';
    },
  },
});

export const { credentialsReceived, sessionEnded } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated';
export const selectIsRestoring = (state) => state.auth.status === 'restoring';
