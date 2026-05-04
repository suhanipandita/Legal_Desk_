import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchDashboardStats } from '../../store/invoiceSlice';
import { fetchCases } from '../../store/caseSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Spinner } from '../../components/Layout';

const COLORS = ['#e94560', '#d4a853', '#1D6FA4', '#1A7A4A', '#CC5500'];

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { dashboardStats } = useSelector((state) => state.invoices);
  const { cases } = useSelector((state) => state.cases);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchCases());
  }, [dispatch]);

  if (!dashboardStats) return <Spinner />;

  const stats = [
    { label: t('admin.totalActive'), value: dashboardStats.totalActiveCases, icon: '📁', color: 'from-blue-500/20 to-blue-600/5' },
    { label: t('admin.closedMonth'), value: dashboardStats.closedThisMonth, icon: '✅', color: 'from-green-500/20 to-green-600/5' },
    { label: t('admin.revenue'), value: `₹${(dashboardStats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: '💰', color: 'from-[var(--color-gold)]/20 to-[var(--color-gold)]/5' },
    { label: t('admin.pendingInvoices'), value: dashboardStats.pendingInvoices, icon: '⏳', color: 'from-red-500/20 to-red-600/5' },
  ];

  const workloadData = (dashboardStats.lawyerWorkload || []).map((w) => ({
    name: w.name || 'Unknown',
    cases: w.count,
  }));

  const statusCounts = {
    active: cases.filter(c => c.status === 'active').length,
    urgent: cases.filter(c => c.status === 'urgent').length,
    hearing_soon: cases.filter(c => c.status === 'hearing_soon').length,
    completed: cases.filter(c => c.status === 'completed').length,
    closed: cases.filter(c => c.status === 'closed').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('admin.firmDashboard')}</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Overview of your law firm operations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`glass-card bg-gradient-to-br ${stat.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Lawyer Workload Chart */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">{t('admin.workload')}</h3>
          {workloadData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'white' }}
                />
                <Bar dataKey="cases" radius={[8, 8, 0, 0]}>
                  {workloadData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[var(--color-text-secondary)] text-center py-8">No data available</p>
          )}
        </div>

        {/* Case Status Summary */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Case Status Summary</h3>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <span className={`status-badge status-${status}`}>{t(`status.${status}`)}</span>
                </div>
                <span className="text-xl font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Cases</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-3 px-4 text-sm text-[var(--color-text-secondary)]">Case</th>
                <th className="text-left py-3 px-4 text-sm text-[var(--color-text-secondary)]">Client</th>
                <th className="text-left py-3 px-4 text-sm text-[var(--color-text-secondary)]">Lawyer</th>
                <th className="text-left py-3 px-4 text-sm text-[var(--color-text-secondary)]">Status</th>
                <th className="text-left py-3 px-4 text-sm text-[var(--color-text-secondary)]">Next Hearing</th>
              </tr>
            </thead>
            <tbody>
              {cases.slice(0, 5).map((c) => (
                <tr key={c._id} className="border-b border-[var(--color-border)]/50 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <p className="text-white font-medium">{c.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{c.caseNumber}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">{c.clientInfo?.name || '—'}</td>
                  <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">{c.lawyerInfo?.name || '—'}</td>
                  <td className="py-3 px-4"><span className={`status-badge status-${c.status}`}>{t(`status.${c.status}`)}</span></td>
                  <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">
                    {c.nextHearingDate ? new Date(c.nextHearingDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
