import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMyCases } from '../../store/caseSlice';
import { fetchAppointments } from '../../store/appointmentSlice';
import CaseCard from '../../components/CaseCard';
import { Spinner } from '../../components/Layout';

export default function ClientDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cases, loading } = useSelector((state) => state.cases);
  const { appointments } = useSelector((state) => state.appointments);

  useEffect(() => {
    dispatch(fetchMyCases());
    dispatch(fetchAppointments());
  }, [dispatch]);

  if (loading) return <Spinner />;

  const upcoming = appointments.filter(a => new Date(a.dateTime) > new Date() && a.status !== 'cancelled');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('nav.dashboard')}</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Welcome! Track your cases and appointments.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card bg-gradient-to-br from-blue-500/20 to-transparent">
          <p className="text-3xl font-bold text-blue-400">{cases.length}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">My Cases</p>
        </div>
        <div className="glass-card bg-gradient-to-br from-green-500/20 to-transparent">
          <p className="text-3xl font-bold text-green-400">{upcoming.length}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Upcoming Appointments</p>
        </div>
        <div className="glass-card bg-gradient-to-br from-amber-500/20 to-transparent">
          <p className="text-3xl font-bold text-amber-400">{cases.filter(c => c.status === 'active').length}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Active Cases</p>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcoming.length > 0 && (
        <div className="glass-card border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-white mb-3">📅 Upcoming Appointments</h3>
          <div className="space-y-2">
            {upcoming.slice(0, 3).map(apt => (
              <div key={apt._id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-white font-medium">{apt.lawyerInfo?.name || 'Lawyer'}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{apt.notes}</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm">{new Date(apt.dateTime).toLocaleDateString('en-IN')}</p>
                  <p className="text-xs text-[var(--color-accent)]">{new Date(apt.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cases */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">{t('cases.title')}</h2>
        <div className="grid grid-cols-2 gap-4">
          {cases.map(c => (
            <CaseCard key={c._id} caseData={c} onClick={() => navigate(`/client/cases/${c._id}`)} />
          ))}
        </div>
        {cases.length === 0 && (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">
            <p className="text-5xl mb-4">📁</p>
            <p>No cases assigned to you yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
