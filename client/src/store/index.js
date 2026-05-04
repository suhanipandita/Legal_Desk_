import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import caseReducer from './caseSlice';
import documentReducer from './documentSlice';
import appointmentReducer from './appointmentSlice';
import invoiceReducer from './invoiceSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    cases: caseReducer,
    documents: documentReducer,
    appointments: appointmentReducer,
    invoices: invoiceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Store reference for API interceptor
window.__REDUX_STORE__ = store;

export default store;
