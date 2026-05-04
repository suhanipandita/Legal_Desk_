import { useTranslation } from 'react-i18next';
import StatusBadge from './StatusBadge';

export default function CaseCard({ caseData, onClick }) {
  const { t } = useTranslation();

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="glass-card cursor-pointer group" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white group-hover:text-[var(--color-accent)] transition-colors">
            {caseData.title}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{caseData.caseNumber}</p>
        </div>
        <StatusBadge status={caseData.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div>
          <span className="text-[var(--color-text-secondary)]">{t('cases.type')}:</span>
          <span className="ml-2 text-white">{caseData.type || '—'}</span>
        </div>
        <div>
          <span className="text-[var(--color-text-secondary)]">{t('cases.court')}:</span>
          <span className="ml-2 text-white">{caseData.courtName || '—'}</span>
        </div>
        <div>
          <span className="text-[var(--color-text-secondary)]">{t('cases.nextHearing')}:</span>
          <span className="ml-2 text-white">{formatDate(caseData.nextHearingDate)}</span>
        </div>
        <div>
          <span className="text-[var(--color-text-secondary)]">{t('cases.lawyer')}:</span>
          <span className="ml-2 text-white">{caseData.lawyerInfo?.name || caseData.clientInfo?.name || '—'}</span>
        </div>
      </div>

      {caseData.missingDocs && (
        <div className="mt-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span className="text-xs text-orange-400 font-medium">Missing Documents</span>
        </div>
      )}
    </div>
  );
}
