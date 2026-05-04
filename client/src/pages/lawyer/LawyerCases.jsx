import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchCases } from '../../store/caseSlice';
import CaseCard from '../../components/CaseCard';
import { Spinner } from '../../components/Layout';

export default function LawyerCases() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cases, loading } = useSelector((state) => state.cases);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { dispatch(fetchCases()); }, [dispatch]);

  const filtered = cases.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.caseNumber?.toLowerCase().includes(search.toLowerCase()) ||
      c.clientInfo?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">📁 {t('cases.allCases')}</h1>

      <div className="flex gap-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search')} className="input-field flex-1" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field !w-auto">
          <option value="all">All Status</option>
          <option value="urgent">Urgent</option>
          <option value="hearing_soon">Hearing Soon</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map(c => (
          <CaseCard key={c._id} caseData={c} onClick={() => navigate(`/lawyer/cases/${c._id}`)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          <p className="text-5xl mb-4">📁</p>
          <p>{t('common.noData')}</p>
        </div>
      )}
    </div>
  );
}
