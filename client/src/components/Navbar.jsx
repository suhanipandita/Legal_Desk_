import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import { updateLanguage } from '../store/authSlice';

export default function Navbar() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'mr' : 'en';
    i18n.changeLanguage(newLang);
    dispatch(updateLanguage(newLang));
  };

  const roleLabel = {
    admin: '🏛️ Admin',
    lawyer: '⚖️ Lawyer',
    client: '👤 Client',
  };

  return (
    <nav className="sticky top-0 z-50 bg-[var(--color-primary-dark)]/90 backdrop-blur-xl border-b border-[var(--color-border)]">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-gold)] flex items-center justify-center text-white font-bold text-sm">
            LD
          </div>
          <h1 className="text-xl font-bold gradient-text">{t('app.name')}</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
            id="language-toggle"
          >
            🌐 {i18n.language === 'en' ? 'मराठी' : 'English'}
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-[var(--color-border)]">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{roleLabel[user?.role]}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-gold)] flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors text-sm"
            id="logout-btn"
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </nav>
  );
}
