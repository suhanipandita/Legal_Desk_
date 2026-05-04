import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchCases } from '../../store/caseSlice';

export default function Calendar() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { cases } = useSelector((state) => state.cases);

  useEffect(() => { dispatch(fetchCases()); }, [dispatch]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const getEventsForDay = (day) => {
    const date = new Date(year, month, day);
    return cases.filter(c => {
      if (c.nextHearingDate) {
        const hd = new Date(c.nextHearingDate);
        if (hd.getDate() === day && hd.getMonth() === month && hd.getFullYear() === year) return true;
      }
      if (c.filingDeadline) {
        const fd = new Date(c.filingDeadline);
        if (fd.getDate() === day && fd.getMonth() === month && fd.getFullYear() === year) return true;
      }
      return false;
    });
  };

  const getDayColor = (day) => {
    const date = new Date(year, month, day);
    const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '';
    if (diff <= 7) return 'bg-red-500/20 border-red-500/50';
    if (diff <= 14) return 'bg-amber-500/20 border-amber-500/50';
    return 'bg-green-500/20 border-green-500/50';
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">📅 {t('nav.calendar')}</h1>
      <div className="glass-card">
        <h2 className="text-xl font-semibold text-white text-center mb-4">{monthName}</h2>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-[var(--color-text-secondary)] py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (!day) return <div key={i} />;
            const events = getEventsForDay(day);
            const isToday = day === now.getDate();
            return (
              <div key={i} className={`min-h-[80px] rounded-lg border p-2 transition-all ${
                events.length > 0 ? getDayColor(day) : 'border-[var(--color-border)] hover:border-[var(--color-border)]/80'
              } ${isToday ? 'ring-2 ring-[var(--color-accent)]' : ''}`}>
                <span className={`text-sm font-medium ${isToday ? 'text-[var(--color-accent)]' : 'text-white'}`}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {events.slice(0, 2).map(e => (
                    <div key={e._id} className="text-[10px] truncate text-[var(--color-text-secondary)] bg-white/5 rounded px-1 py-0.5">
                      {e.title}
                    </div>
                  ))}
                  {events.length > 2 && <span className="text-[10px] text-[var(--color-accent)]">+{events.length - 2} more</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 pt-4 border-t border-[var(--color-border)] justify-center">
          <span className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"><span className="w-3 h-3 rounded bg-red-500/30"></span> This Week</span>
          <span className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"><span className="w-3 h-3 rounded bg-amber-500/30"></span> Next Week</span>
          <span className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"><span className="w-3 h-3 rounded bg-green-500/30"></span> Later</span>
        </div>
      </div>
    </div>
  );
}
