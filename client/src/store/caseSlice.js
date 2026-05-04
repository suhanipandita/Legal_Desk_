import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchCases = createAsyncThunk('cases/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cases');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch cases');
  }
});

export const fetchMyCases = createAsyncThunk('cases/fetchMine', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cases/client/mine');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch cases');
  }
});

export const fetchCaseById = createAsyncThunk('cases/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/cases/${id}`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch case');
  }
});

export const createCase = createAsyncThunk('cases/create', async (caseData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cases', caseData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create case');
  }
});

export const updateCase = createAsyncThunk('cases/update', async ({ id, updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/cases/${id}`, updates);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update case');
  }
});

export const deleteCase = createAsyncThunk('cases/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/cases/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete case');
  }
});

const caseSlice = createSlice({
  name: 'cases',
  initialState: { cases: [], currentCase: null, loading: false, error: null },
  reducers: {
    clearCurrentCase: (state) => { state.currentCase = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCases.pending, (state) => { state.loading = true; })
      .addCase(fetchCases.fulfilled, (state, action) => { state.loading = false; state.cases = action.payload; })
      .addCase(fetchCases.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchMyCases.pending, (state) => { state.loading = true; })
      .addCase(fetchMyCases.fulfilled, (state, action) => { state.loading = false; state.cases = action.payload; })
      .addCase(fetchMyCases.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchCaseById.fulfilled, (state, action) => { state.currentCase = action.payload; })
      .addCase(createCase.fulfilled, (state, action) => { state.cases.unshift(action.payload); })
      .addCase(updateCase.fulfilled, (state, action) => {
        const idx = state.cases.findIndex(c => c._id === action.payload._id);
        if (idx !== -1) state.cases[idx] = action.payload;
        if (state.currentCase?._id === action.payload._id) state.currentCase = action.payload;
      })
      .addCase(deleteCase.fulfilled, (state, action) => {
        state.cases = state.cases.filter(c => c._id !== action.payload);
      });
  },
});

export const { clearCurrentCase } = caseSlice.actions;
export default caseSlice.reducer;
