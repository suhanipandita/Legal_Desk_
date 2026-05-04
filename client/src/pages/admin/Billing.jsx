import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchCases } from '../../store/caseSlice';
import { Spinner } from '../../components/Layout';
import api from '../../services/api';
import { useState } from 'react';

export default function AdminBilling() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { cases, loading } = useSelector((state) => state.cases);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    dispatch(fetchCases());
  }, [dispatch]);

  useEffect(() => {
    const fetchAllInvoices = async () => {
      const allInvoices = [];
      for (const c of cases) {
        try {
          const { data } = await api.get(`/invoices/case/${c._id}`);
          allInvoices.push(...data.map(inv => ({ ...inv, caseTitle: c.title, caseNumber: c.caseNumber })));
        } catch (e) {}
      }
      setInvoices(allInvoices);
    };
    if (cases.length > 0) fetchAllInvoices();
  }, [cases]);

  const updateStatus = async (id, paymentStatus) => {
    try {
      await api.put(`/invoices/${id}/status`, { paymentStatus });
      setInvoices(invoices.map(inv => inv._id === id ? { ...inv, paymentStatus } : inv));
    } catch (e) { alert('Failed to update status'); }
  };

  const downloadPdf = (id) => {
    window.open(`/api/invoices/${id}/pdf`, '_blank');
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('billing.title')}</h1>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left py-3 px-4 text-sm text-[var(--color-text-secondary)]">Case</th>
              <th className="text-left py-3 px-4 text-sm text-[var(--color-text-secondary)]">Client</th>
              <th className="text-left py-3 px-4 text-sm text-[var(--color-text-secondary)]">Hours</th>
              <th className="text-left py-3 px-4 text-sm text-[var(--color-text-secondary)]">Total</th>
              <th className="text-left py-3 px-4 text-sm text-[var(--color-text-secondary)]">Status</th>
              <th className="text-left py-3 px-4 text-sm text-[var(--color-text-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id} className="border-b border-[var(--color-border)]/50 hover:bg-white/5">
                <td className="py-3 px-4">
                  <p className="text-white font-medium">{inv.caseTitle}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{inv.caseNumber}</p>
                </td>
                <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">{inv.clientInfo?.name || '—'}</td>
                <td className="py-3 px-4 text-sm text-white">{inv.billableHours}h @ ₹{inv.hourlyRate}/hr</td>
                <td className="py-3 px-4 text-sm font-bold text-white">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
                <td className="py-3 px-4">
                  <span className={`status-badge payment-${inv.paymentStatus}`}>
                    {inv.paymentStatus}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <select
                      value={inv.paymentStatus}
                      onChange={(e) => updateStatus(inv._id, e.target.value)}
                      className="input-field !py-1 !px-2 text-xs !w-auto"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    <button onClick={() => downloadPdf(inv._id)} className="btn-secondary !py-1 !px-3 text-xs">
                      📄 PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <p className="text-center py-8 text-[var(--color-text-secondary)]">{t('common.noData')}</p>
        )}
      </div>
    </div>
  );
}
