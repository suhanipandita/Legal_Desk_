import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchDocuments = createAsyncThunk('documents/fetch', async (caseId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/documents/case/${caseId}`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed');
  }
});

export const uploadDocument = createAsyncThunk('documents/upload', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Upload failed');
  }
});

export const analyzeDocument = createAsyncThunk('documents/analyze', async ({ id, text }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/documents/${id}/analyze`, { text });
    return { id, summary: data.summary };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Analysis failed');
  }
});

export const chatWithDocument = createAsyncThunk('documents/chat', async ({ id, question, conversationHistory, documentText }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/documents/${id}/chat`, { question, conversationHistory, documentText });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Chat failed');
  }
});

export const shareDocument = createAsyncThunk('documents/share', async ({ id, clientId }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/documents/${id}/share`, { clientId });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Share failed');
  }
});

export const deleteDocument = createAsyncThunk('documents/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/documents/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Delete failed');
  }
});

const documentSlice = createSlice({
  name: 'documents',
  initialState: { documents: [], analysis: null, chatMessages: [], loading: false, analyzing: false, chatting: false, error: null },
  reducers: {
    clearAnalysis: (state) => { state.analysis = null; },
    clearChat: (state) => { state.chatMessages = []; },
    addChatMessage: (state, action) => { state.chatMessages.push(action.payload); },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => { state.loading = true; })
      .addCase(fetchDocuments.fulfilled, (state, action) => { state.loading = false; state.documents = action.payload; })
      .addCase(fetchDocuments.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(uploadDocument.fulfilled, (state, action) => { state.documents.unshift(action.payload); })
      .addCase(analyzeDocument.pending, (state) => { state.analyzing = true; })
      .addCase(analyzeDocument.fulfilled, (state, action) => { state.analyzing = false; state.analysis = action.payload.summary; })
      .addCase(analyzeDocument.rejected, (state, action) => { state.analyzing = false; state.error = action.payload; })
      .addCase(chatWithDocument.pending, (state) => { state.chatting = true; })
      .addCase(chatWithDocument.fulfilled, (state, action) => {
        state.chatting = false;
        state.chatMessages.push({ role: 'assistant', content: action.payload.answer });
      })
      .addCase(chatWithDocument.rejected, (state, action) => { state.chatting = false; state.error = action.payload; })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter(d => d._id !== action.payload);
      });
  },
});

export const { clearAnalysis, clearChat, addChatMessage } = documentSlice.actions;
export default documentSlice.reducer;
