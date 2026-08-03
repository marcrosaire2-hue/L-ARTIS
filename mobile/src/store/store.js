import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import authReducer from '../features/auth/authSlice';

// Les endpoints s'enregistrent via injectEndpoints : leurs modules doivent
// simplement être importés une fois.
import '../features/auth/auth.api';
import '../features/catalog/catalog.api';
import '../features/artisans/artisans.api';
import '../features/reviews/reviews.api';
import '../features/favorites/favorites.api';
import '../features/quotes/quotes.api';
import '../features/notifications/notifications.api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});
