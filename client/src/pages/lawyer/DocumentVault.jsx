import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchCases } from '../../store/caseSlice';
import { fetchDocuments, uploadDocument, deleteDocument, shareDocument } from '../../store/documentSlice';
import { Spinner } from '../../components/Layout';

export default function DocumentVault() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { cases } = useSelector((state) => state.cases);
  const { documents, loading } = useSelector((state) => state.documents);
  const [selectedCase, setSelectedCase] = useState('');

  useEffect(() => { dispatch(fetchCases()); }, [dispatch]);
  useEffect(() => { if (selectedCase) dispatch(fetchDocuments(selectedCase)); }, [selectedCase, dispatch]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedCase) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', selectedCase);
    formData.append('sharedWith', JSON.stringify([]));
    await dispatch(uploadDocument(formData));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">📄 {t('documents.title')}</h1>
      </div>

      <div className="flex gap-4 items-center">
        <select value={selectedCase} onChange={e => setSelectedCase(e.target.value)} className="input-field !w-auto min-w-[300px]">
          <option value="">Select a case...</option>
          {cases.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
        {selectedCase && (
          <label>
            <span className="btn-primary cursor-pointer">📤 {t('documents.upload')}</span>
            <input type="file" accept=".pdf,.docx" onChange={handleUpload} className="hidden" />
          </label>
        )}
      </div>

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-3 gap-4">
          {documents.map(doc => (
            <div key={doc._id} className="glass-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{doc.fileType === 'pdf' ? '📕' : '📘'}</span>
                  <div>
                    <p className="text-white font-medium text-sm truncate max-w-[180px]">{doc.fileName}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">v{doc.version} • {doc.fileType?.toUpperCase()}</p>
                  </div>
                </div>
                {doc.isSigned && <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">{t('documents.signed')}</span>}
              </div>
              <div className="flex gap-2 mt-3">
                {doc.fileUrl && !doc.fileUrl.startsWith('local://') && (
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn-secondary !py-1.5 !px-3 text-xs">{t('documents.download')}</a>
                )}
                <button onClick={() => dispatch(deleteDocument(doc._id))} className="btn-secondary !py-1.5 !px-3 text-xs text-red-400">{t('common.delete')}</button>
              </div>
            </div>
          ))}
          {selectedCase && documents.length === 0 && (
            <div className="col-span-3 text-center py-12 text-[var(--color-text-secondary)]">
              <p className="text-5xl mb-4">📂</p>
              <p>No documents in this case yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
