import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

const navItems = {
  admin: [
    { path: '/admin', icon: '📊', key: 'nav.dashboard' },
    { path: '/admin/cases', icon: '📁', key: 'nav.cases' },
    { path: '/admin/staff', icon: '👥', key: 'nav.staff' },
    { path: '/admin/billing', icon: '💰', key: 'nav.billing' },
  ],
  lawyer: [
    { path: '/lawyer', icon: '📊', key: 'nav.dashboard' },
    { path: '/lawyer/cases', icon: '📁', key: 'nav.cases' },
    { path: '/lawyer/ai-analyzer', icon: '🤖', key: 'nav.aiAnalyzer' },
    { path: '/lawyer/documents', icon: '📄', key: 'nav.documents' },
    { path: '/lawyer/calendar', icon: '📅', key: 'nav.calendar' },
    { path: '/lawyer/billing', icon: '💰', key: 'nav.billing' },
  ],
  client: [
    { path: '/client', icon: '📊', key: 'nav.dashboard' },
    { path: '/client/cases', icon: '📁', key: 'nav.cases' },
    { path: '/client/appointments', icon: '📅', key: 'nav.appointments' },
    { path: '/client/documents', icon: '📄', key: 'nav.documents' },
  ],
};

export default function Sidebar() {
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const items = navItems[user?.role] || [];

  return (
    <aside className="w-64 min-h-[calc(100vh-64px)] bg-[var(--color-surface)]/50 border-r border-[var(--color-border)] p-4 flex flex-col">
      <div className="flex-1 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === `/${user?.role}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[var(--color-accent)]/20 to-transparent text-[var(--color-accent)] border-l-2 border-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{t(item.key)}</span>
          </NavLink>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
        <div className="px-4 py-2">
          <p className="text-xs text-[var(--color-text-secondary)]">⚖️ LegalDesk v1.0</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">AI-Powered Legal Management</p>
        </div>
      </div>
    </aside>
  );
}
