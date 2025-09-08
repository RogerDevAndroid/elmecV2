import { configureStore } from '@reduxjs/toolkit';
import calculatorReducer from './calculatorSlice';

export const store = configureStore({
  reducer: {
    calculator: calculatorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;