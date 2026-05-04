import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchMyCases } from '../../store/caseSlice';
import { fetchDocuments } from '../../store/documentSlice';

export default function MyDocuments() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { cases } = useSelector((state) => state.cases);
  const { documents, loading } = useSelector((state) => state.documents);
  const [selectedCase, setSelectedCase] = useState('');

  useEffect(() => { dispatch(fetchMyCases()); }, [dispatch]);
  useEffect(() => { if (selectedCase) dispatch(fetchDocuments(selectedCase)); }, [selectedCase, dispatch]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">📄 {t('documents.title')}</h1>

      <select value={selectedCase} onChange={e => setSelectedCase(e.target.value)} className="input-field !w-auto min-w-[300px]">
        <option value="">Select a case...</option>
        {cases.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
      </select>

      <div className="grid grid-cols-3 gap-4">
        {documents.map(doc => (
          <div key={doc._id} className="glass-card">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{doc.fileType === 'pdf' ? '📕' : '📘'}</span>
              <div>
                <p className="text-white font-medium text-sm truncate max-w-[180px]">{doc.fileName}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">v{doc.version}</p>
              </div>
            </div>
            {doc.isSigned && <span className="text-xs text-green-400">{t('documents.signed')}</span>}
            {doc.fileUrl && !doc.fileUrl.startsWith('local://') && (
              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn-primary !py-1.5 !px-3 text-xs mt-2 inline-block">
                {t('documents.download')}
              </a>
            )}
          </div>
        ))}
        {selectedCase && documents.length === 0 && (
          <div className="col-span-3 text-center py-12 text-[var(--color-text-secondary)]">
            <p>No shared documents for this case</p>
          </div>
        )}
      </div>
    </div>
  );
}
