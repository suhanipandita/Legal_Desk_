import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchMyCases } from '../../store/caseSlice';
import { fetchAvailability, bookAppointment } from '../../store/appointmentSlice';
import api from '../../services/api';

export default function BookAppointment() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { cases } = useSelector((state) => state.cases);
  const { availability } = useSelector((state) => state.appointments);
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    dispatch(fetchMyCases());
    api.get('/users/lawyers').then(r => setLawyers(r.data)).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (selectedLawyer) dispatch(fetchAvailability(selectedLawyer));
  }, [selectedLawyer, dispatch]);

  const handleBook = async () => {
    if (!selectedLawyer || !selectedSlot) return;
    await dispatch(bookAppointment({ lawyer: selectedLawyer, dateTime: selectedSlot, notes }));
    setBooked(true);
    setTimeout(() => setBooked(false), 3000);
  };

  const groupByDate = (slots) => {
    const grouped = {};
    slots.forEach(s => {
      const dateStr = new Date(s.dateTime).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(s);
    });
    return grouped;
  };

  const groupedSlots = groupByDate(availability);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">📅 {t('appointments.book')}</h1>

      {booked && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400">
          ✅ Appointment booked successfully! Your lawyer will confirm soon.
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-white mb-3">Select Lawyer</h3>
          <div className="space-y-2">
            {lawyers.map(l => (
              <button
                key={l._id}
                onClick={() => setSelectedLawyer(l._id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedLawyer === l._id ? 'bg-[var(--color-accent)]/20 border border-[var(--color-accent)]' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <p className="text-white font-medium">{l.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{l.specialization || 'General'}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          {selectedLawyer ? (
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-white mb-4">Available Slots</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {Object.entries(groupedSlots).map(([date, slots]) => (
                  <div key={date}>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">{date}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map(s => {
                        const time = new Date(s.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                        const isSelected = selectedSlot === s.dateTime;
                        return (
                          <button
                            key={s.dateTime}
                            onClick={() => setSelectedSlot(s.dateTime)}
                            className={`py-2 px-3 rounded-lg text-sm transition-all ${
                              isSelected ? 'bg-[var(--color-accent)] text-white' : 'bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)]'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {selectedSlot && (
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes (optional)..." className="input-field mb-3" rows={2} />
                  <button onClick={handleBook} className="btn-primary w-full">{t('appointments.book')}</button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card text-center py-16">
              <p className="text-5xl mb-4">👈</p>
              <p className="text-[var(--color-text-secondary)]">Select a lawyer to view available slots</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
