import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchAppointments = createAsyncThunk('appointments/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/appointments/mine');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed');
  }
});

export const fetchAvailability = createAsyncThunk('appointments/availability', async (lawyerId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/appointments/availability/${lawyerId}`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed');
  }
});

export const bookAppointment = createAsyncThunk('appointments/book', async (appointmentData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/appointments', appointmentData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Booking failed');
  }
});

export const updateAppointmentStatus = createAsyncThunk('appointments/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/appointments/${id}/status`, { status });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Update failed');
  }
});

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState: { appointments: [], availability: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => { state.loading = true; })
      .addCase(fetchAppointments.fulfilled, (state, action) => { state.loading = false; state.appointments = action.payload; })
      .addCase(fetchAppointments.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAvailability.fulfilled, (state, action) => { state.availability = action.payload; })
      .addCase(bookAppointment.fulfilled, (state, action) => { state.appointments.push(action.payload); })
      .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
        const idx = state.appointments.findIndex(a => a._id === action.payload._id);
        if (idx !== -1) state.appointments[idx] = action.payload;
      });
  },
});

export default appointmentSlice.reducer;
