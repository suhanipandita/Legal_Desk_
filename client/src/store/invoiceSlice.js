import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchInvoices = createAsyncThunk('invoices/fetch', async (caseId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/invoices/case/${caseId}`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed');
  }
});

export const createInvoice = createAsyncThunk('invoices/create', async (invoiceData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/invoices', invoiceData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed');
  }
});

export const updateInvoice = createAsyncThunk('invoices/update', async ({ id, updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/invoices/${id}`, updates);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed');
  }
});

export const updateInvoiceStatus = createAsyncThunk('invoices/updateStatus', async ({ id, paymentStatus }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/invoices/${id}/status`, { paymentStatus });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed');
  }
});

export const fetchDashboardStats = createAsyncThunk('invoices/dashboardStats', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/stats/dashboard');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed');
  }
});

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState: { invoices: [], dashboardStats: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => { state.loading = true; })
      .addCase(fetchInvoices.fulfilled, (state, action) => { state.loading = false; state.invoices = action.payload; })
      .addCase(fetchInvoices.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createInvoice.fulfilled, (state, action) => { state.invoices.push(action.payload); })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        const idx = state.invoices.findIndex(i => i._id === action.payload._id);
        if (idx !== -1) state.invoices[idx] = action.payload;
      })
      .addCase(updateInvoiceStatus.fulfilled, (state, action) => {
        const idx = state.invoices.findIndex(i => i._id === action.payload._id);
        if (idx !== -1) state.invoices[idx] = action.payload;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => { state.dashboardStats = action.payload; });
  },
});

export default invoiceSlice.reducer;
