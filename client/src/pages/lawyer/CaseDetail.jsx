import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchCaseById, updateCase } from '../../store/caseSlice';
import { fetchDocuments } from '../../store/documentSlice';
import StatusBadge from '../../components/StatusBadge';
import { Spinner } from '../../components/Layout';

export default function CaseDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { currentCase } = useSelector((state) => state.cases);
  const { documents } = useSelector((state) => state.documents);
  const [timelineEvent, setTimelineEvent] = useState('');

  useEffect(() => {
    dispatch(fetchCaseById(id));
    dispatch(fetchDocuments(id));
  }, [dispatch, id]);

  const addTimeline = async () => {
    if (!timelineEvent.trim()) return;
    await dispatch(updateCase({ id, updates: { timelineEvent } }));
    setTimelineEvent('');
    dispatch(fetchCaseById(id));
  };

  if (!currentCase) return <Spinner />;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{currentCase.title}</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{currentCase.caseNumber}</p>
        </div>
        <StatusBadge status={currentCase.status} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Details */}
        <div className="col-span-2 glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Case Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-[var(--color-text-secondary)]">Type:</span> <span className="text-white ml-2">{currentCase.type}</span></div>
            <div><span className="text-[var(--color-text-secondary)]">Court:</span> <span className="text-white ml-2">{currentCase.courtName || '—'}</span></div>
            <div><span className="text-[var(--color-text-secondary)]">Client:</span> <span className="text-white ml-2">{currentCase.clientInfo?.name || '—'}</span></div>
            <div><span className="text-[var(--color-text-secondary)]">Lawyer:</span> <span className="text-white ml-2">{currentCase.lawyerInfo?.name || '—'}</span></div>
            <div><span className="text-[var(--color-text-secondary)]">Next Hearing:</span> <span className="text-white ml-2">{formatDate(currentCase.nextHearingDate)}</span></div>
            <div><span className="text-[var(--color-text-secondary)]">Deadline:</span> <span className="text-white ml-2">{formatDate(currentCase.filingDeadline)}</span></div>
          </div>
          {currentCase.description && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <p className="text-[var(--color-text-secondary)] text-sm">{currentCase.description}</p>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">📄 Documents ({documents.length})</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {documents.map(doc => (
              <div key={doc._id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 text-sm">
                <span className="text-white truncate">{doc.fileName}</span>
                {doc.isSigned && <span className="text-green-400 text-xs">✓ Signed</span>}
              </div>
            ))}
            {documents.length === 0 && <p className="text-[var(--color-text-secondary)] text-sm">No documents yet</p>}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">📋 {t('cases.timeline')}</h3>
        <div className="flex gap-3 mb-4">
          <input value={timelineEvent} onChange={e => setTimelineEvent(e.target.value)} placeholder="Add timeline event..." className="input-field flex-1" />
          <button onClick={addTimeline} className="btn-primary">Add</button>
        </div>
        <div className="space-y-3">
          {(currentCase.timeline || []).slice().reverse().map((evt, i) => (
            <div key={i} className="flex items-start gap-3 pl-4 border-l-2 border-[var(--color-accent)]/30">
              <div className="w-3 h-3 rounded-full bg-[var(--color-accent)] mt-1.5 -ml-[22px]"></div>
              <div>
                <p className="text-white text-sm">{evt.event}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{formatDate(evt.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
