import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchCases } from '../../store/caseSlice';
import { fetchAppointments } from '../../store/appointmentSlice';
import CaseCard from '../../components/CaseCard';
import { Spinner } from '../../components/Layout';

export default function LawyerDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cases, loading } = useSelector((state) => state.cases);
  const { appointments } = useSelector((state) => state.appointments);

  useEffect(() => {
    dispatch(fetchCases());
    dispatch(fetchAppointments());
  }, [dispatch]);

  if (loading) return <Spinner />;

  const urgentCases = cases.filter(c => c.status === 'urgent');
  const hearingSoon = cases.filter(c => c.status === 'hearing_soon');
  const activeCases = cases.filter(c => c.status === 'active');
  const todayAppointments = appointments.filter(a => {
    const d = new Date(a.dateTime);
    const today = new Date();
    return d.toDateString() === today.toDateString() && a.status !== 'cancelled';
  });

  const statusOrder = { urgent: 0, hearing_soon: 1, active: 2, completed: 3, closed: 4 };
  const sortedCases = [...cases].sort((a, b) => (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('nav.dashboard')}</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Welcome back! Here's your case overview.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card bg-gradient-to-br from-red-500/20 to-transparent">
          <p className="text-3xl font-bold text-red-400">{urgentCases.length}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Urgent Cases</p>
        </div>
        <div className="glass-card bg-gradient-to-br from-amber-500/20 to-transparent">
          <p className="text-3xl font-bold text-amber-400">{hearingSoon.length}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Hearing Soon</p>
        </div>
        <div className="glass-card bg-gradient-to-br from-blue-500/20 to-transparent">
          <p className="text-3xl font-bold text-blue-400">{activeCases.length}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Active Cases</p>
        </div>
        <div className="glass-card bg-gradient-to-br from-green-500/20 to-transparent">
          <p className="text-3xl font-bold text-green-400">{todayAppointments.length}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Today's Appointments</p>
        </div>
      </div>

      {/* Today's Appointments */}
      {todayAppointments.length > 0 && (
        <div className="glass-card border-l-4 border-[var(--color-accent)]">
          <h3 className="text-lg font-semibold text-white mb-3">📅 Today's Appointments</h3>
          <div className="space-y-2">
            {todayAppointments.map(apt => (
              <div key={apt._id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-white font-medium">{apt.clientInfo?.name || 'Client'}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{apt.notes}</p>
                </div>
                <p className="text-[var(--color-accent)] font-medium">
                  {new Date(apt.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cases Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">{t('cases.allCases')} ({cases.length})</h2>
        <div className="grid grid-cols-2 gap-4">
          {sortedCases.map(c => (
            <CaseCard key={c._id} caseData={c} onClick={() => navigate(`/lawyer/cases/${c._id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}
