import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import authReducer from '../features/auth/authSlice';

// Les endpoints s'auto-enregistrent auprès de `api` via injectEndpoints :
// il suffit que leurs modules soient importés une fois.
import '../features/auth/auth.api';
import '../features/artisans/artisans.api';
import '../features/users/users.api';
import '../features/reviews/reviews.api';
import '../features/catalog/catalog.api';
import '../features/admins/admins.api';
import '../features/activities/activities.api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});
