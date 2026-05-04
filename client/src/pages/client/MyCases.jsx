import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMyCases } from '../../store/caseSlice';
import CaseCard from '../../components/CaseCard';
import { Spinner } from '../../components/Layout';

export default function MyCases() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cases, loading } = useSelector((state) => state.cases);

  useEffect(() => { dispatch(fetchMyCases()); }, [dispatch]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">📁 {t('cases.title')}</h1>
      <div className="grid grid-cols-2 gap-4">
        {cases.map(c => (
          <CaseCard key={c._id} caseData={c} onClick={() => navigate(`/client/cases/${c._id}`)} />
        ))}
      </div>
      {cases.length === 0 && (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          <p className="text-5xl mb-4">📁</p>
          <p>No cases assigned to you</p>
        </div>
      )}
    </div>
  );
}
