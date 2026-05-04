import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchCases, createCase, deleteCase, updateCase } from '../../store/caseSlice';
import CaseCard from '../../components/CaseCard';
import { Spinner } from '../../components/Layout';
import api from '../../services/api';

export default function ManageCases() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { cases, loading } = useSelector((state) => state.cases);
  const [showForm, setShowForm] = useState(false);
  const [lawyers, setLawyers] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ title: '', type: 'Civil', client: '', lawyer: '', courtName: '', nextHearingDate: '', description: '' });

  useEffect(() => {
    dispatch(fetchCases());
    api.get('/users/lawyers').then(r => setLawyers(r.data)).catch(() => {});
    api.get('/users/clients').then(r => setClients(r.data)).catch(() => {});
  }, [dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await dispatch(createCase(form));
    setShowForm(false);
    setForm({ title: '', type: 'Civil', client: '', lawyer: '', courtName: '', nextHearingDate: '', description: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      dispatch(deleteCase(id));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('cases.allCases')}</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" id="create-case-btn">
          + {t('cases.createCase')}
        </button>
      </div>

      {showForm && (
        <div className="glass-card animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">{t('cases.createCase')}</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field">
                <option value="Civil">Civil</option>
                <option value="Criminal">Criminal</option>
                <option value="Property">Property</option>
                <option value="Family">Family</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Client</label>
              <select value={form.client} onChange={e => setForm({...form, client: e.target.value})} className="input-field" required>
                <option value="">Select Client</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Lawyer</label>
              <select value={form.lawyer} onChange={e => setForm({...form, lawyer: e.target.value})} className="input-field" required>
                <option value="">Select Lawyer</option>
                {lawyers.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Court</label>
              <input value={form.courtName} onChange={e => setForm({...form, courtName: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Next Hearing</label>
              <input type="date" value={form.nextHearingDate} onChange={e => setForm({...form, nextHearingDate: e.target.value})} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={3} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {cases.map((c) => (
          <div key={c._id} className="relative">
            <CaseCard caseData={c} />
            <button
              onClick={() => handleDelete(c._id)}
              className="absolute top-4 right-4 text-red-400 hover:text-red-300 text-sm opacity-0 group-hover:opacity-100"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {cases.length === 0 && (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          <p className="text-5xl mb-4">📁</p>
          <p>{t('common.noData')}</p>
        </div>
      )}
    </div>
  );
}
