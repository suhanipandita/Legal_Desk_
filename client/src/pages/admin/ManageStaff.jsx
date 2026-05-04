import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Spinner } from '../../components/Layout';

export default function ManageStaff() {
  const { t } = useTranslation();
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', specialization: '' });
  const [stats, setStats] = useState({});

  const fetchLawyers = async () => {
    try {
      const { data } = await api.get('/users/lawyers');
      setLawyers(data);
      // Fetch stats for each lawyer
      for (const l of data) {
        try {
          const { data: s } = await api.get(`/users/lawyers/${l._id}/stats`);
          setStats(prev => ({ ...prev, [l._id]: s }));
        } catch (e) {}
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchLawyers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/lawyers', form);
      setShowForm(false);
      setForm({ name: '', email: '', password: '', phone: '', specialization: '' });
      fetchLawyers();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this lawyer?')) {
      await api.delete(`/users/${id}`);
      fetchLawyers();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('nav.staff')}</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add Lawyer</button>
      </div>

      {showForm && (
        <div className="glass-card animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">Create Lawyer Account</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full Name" className="input-field" required />
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" type="email" className="input-field" required />
            <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Password" type="password" className="input-field" required />
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="input-field" />
            <input value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} placeholder="Specialization" className="input-field" />
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {lawyers.map((l) => (
          <div key={l._id} className="glass-card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-gold)] flex items-center justify-center text-white font-bold text-lg">
                  {l.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{l.name}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">{l.email}</p>
                  {l.specialization && <p className="text-xs text-[var(--color-accent)]">{l.specialization}</p>}
                </div>
              </div>
              <button onClick={() => handleDelete(l._id)} className="text-red-400 hover:text-red-300">🗑️</button>
            </div>

            {stats[l._id] && (
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{stats[l._id].totalCases}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Total Cases</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-green-400">{stats[l._id].activeCases}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[var(--color-gold)]">₹{(stats[l._id].totalRevenue || 0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Revenue</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
