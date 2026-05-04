import { useTranslation } from 'react-i18next';

const statusConfig = {
  active:       { label: 'status.active',       dot: 'bg-blue-500',   bg: 'status-active' },
  urgent:       { label: 'status.urgent',       dot: 'bg-red-500',    bg: 'status-urgent' },
  hearing_soon: { label: 'status.hearing_soon', dot: 'bg-amber-500',  bg: 'status-hearing_soon' },
  completed:    { label: 'status.completed',    dot: 'bg-green-500',  bg: 'status-completed' },
  closed:       { label: 'status.closed',       dot: 'bg-gray-500',   bg: 'status-closed' },
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const config = statusConfig[status] || statusConfig.active;

  return (
    <span className={`status-badge ${config.bg}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
      {t(config.label)}
    </span>
  );
}
