import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchCases } from '../../store/caseSlice';
import api from '../../services/api';

export default function ExpenseTracker() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { cases } = useSelector((state) => state.cases);
  const [selectedCase, setSelectedCase] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState({ billableHours: 0, hourlyRate: 2000, description: '', amount: 0 });

  useEffect(() => { dispatch(fetchCases()); }, [dispatch]);

  useEffect(() => {
    if (selectedCase) {
      api.get(`/invoices/case/${selectedCase}`).then(r => setInvoices(r.data)).catch(() => {});
    }
  }, [selectedCase]);

  const caseData = cases.find(c => c._id === selectedCase);

  const handleCreateInvoice = async () => {
    if (!selectedCase || !caseData) return;
    try {
      const { data } = await api.post('/invoices', {
        case: selectedCase,
        client: caseData.client?._id || caseData.client,
        lawyer: caseData.lawyer?._id || caseData.lawyer,
        billableHours: form.billableHours,
        hourlyRate: form.hourlyRate,
        expenses: form.description ? [{ description: form.description, amount: form.amount, date: new Date() }] : [],
      });
      setInvoices([...invoices, data]);
    } catch (e) { alert('Failed to create invoice'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">💰 {t('billing.title')}</h1>

      <select value={selectedCase} onChange={e => setSelectedCase(e.target.value)} className="input-field !w-auto min-w-[300px]">
        <option value="">Select a case...</option>
        {cases.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
      </select>

      {selectedCase && (
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">Log Billing</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">{t('billing.hours')}</label>
                  <input type="number" value={form.billableHours} onChange={e => setForm({...form, billableHours: +e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">{t('billing.rate')} (₹)</label>
                  <input type="number" value={form.hourlyRate} onChange={e => setForm({...form, hourlyRate: +e.target.value})} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Expense Description</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Expense Amount (₹)</label>
                <input type="number" value={form.amount} onChange={e => setForm({...form, amount: +e.target.value})} className="input-field" />
              </div>
              <button onClick={handleCreateInvoice} className="btn-primary w-full">{t('billing.generateInvoice')}</button>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">Invoices</h3>
            <div className="space-y-3">
              {invoices.map(inv => (
                <div key={inv._id} className="p-3 rounded-lg bg-white/5">
                  <div className="flex justify-between items-center">
                    <p className="text-white font-medium">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</p>
                    <span className={`status-badge payment-${inv.paymentStatus}`}>{inv.paymentStatus}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{inv.billableHours}h @ ₹{inv.hourlyRate}/hr</p>
                </div>
              ))}
              {invoices.length === 0 && <p className="text-[var(--color-text-secondary)] text-sm">No invoices yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
