import { createSlice } from '@reduxjs/toolkit';

/**
 * Session utilisateur (client ou artisan).
 * L'access token reste en mémoire — jamais dans localStorage, où la moindre
 * injection XSS le rendrait lisible. La persistance entre rechargements passe
 * par le cookie httpOnly de refresh.
 */
const initialState = {
  user: null,
  accessToken: null,
  status: 'restoring',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    credentialsReceived(state, action) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = 'authenticated';
    },
    userUpdated(state, action) {
      state.user = action.payload;
    },
    sessionEnded(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'anonymous';
    },
  },
});

export const { credentialsReceived, userUpdated, sessionEnded } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated';
export const selectIsRestoring = (state) => state.auth.status === 'restoring';
export const selectIsArtisan = (state) => state.auth.user?.role === 'artisan';
