import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login, clearError } from '../../store/authSlice';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      const role = result.payload.user.role;
      navigate(`/${role}`);
    }
  };

  const demoCredentials = [
    { role: 'Admin', icon: '🏛️', email: 'admin@legaldesk.com', pass: 'admin123', desc: 'Firm Management' },
    { role: 'Lawyer', icon: '⚖️', email: 'lawyer@legaldesk.com', pass: 'lawyer123', desc: 'Case & AI Tools' },
    { role: 'Client', icon: '👤', email: 'client@legaldesk.com', pass: 'client123', desc: 'Case Tracking' },
  ];

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1"></div>
        <div className="login-bg-orb login-bg-orb-2"></div>
        <div className="login-bg-orb login-bg-orb-3"></div>
        <div className="login-bg-grid"></div>
      </div>

      <div className="login-container">
        {/* Left Panel - Branding */}
        <div className="login-brand-panel">
          <div className="login-brand-content">
            <div className="login-logo">
              <div className="login-logo-icon">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4L6 12V28L20 36L34 28V12L20 4Z" fill="url(#grad)" opacity="0.2" stroke="url(#grad)" strokeWidth="1.5"/>
                  <path d="M20 10L12 15V25L20 30L28 25V15L20 10Z" fill="url(#grad)" opacity="0.4"/>
                  <path d="M16 18H24M16 22H22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="grad" x1="6" y1="4" x2="34" y2="36">
                      <stop stopColor="#e94560"/>
                      <stop offset="1" stopColor="#d4a853"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <h1 className="login-logo-text">LegalDesk</h1>
                <p className="login-logo-sub">AI-Powered Legal Management</p>
              </div>
            </div>

            <div className="login-features">
              <div className="login-feature">
                <span className="login-feature-icon">🤖</span>
                <div>
                  <h3>AI Document Analysis</h3>
                  <p>Claude AI analyzes contracts & FIRs in seconds</p>
                </div>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">📊</span>
                <div>
                  <h3>3 Role Dashboards</h3>
                  <p>Separate views for Admin, Lawyer & Client</p>
                </div>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">🌐</span>
                <div>
                  <h3>Bilingual Support</h3>
                  <p>Full UI in English & Marathi</p>
                </div>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">🔒</span>
                <div>
                  <h3>Secure & Role-Based</h3>
                  <p>JWT auth with strict access control</p>
                </div>
              </div>
            </div>

            <div className="login-brand-footer">
              <p>React.js · Node.js · MongoDB · Claude AI</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2>{t('auth.loginTitle')}</h2>
              <p>{t('auth.loginSubtitle')}</p>
            </div>

            {error && (
              <div className="login-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label>{t('auth.email')}</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    id="login-email"
                  />
                </div>
              </div>

              <div className="login-field">
                <label>{t('auth.password')}</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">🔑</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    id="login-password"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-submit" id="login-submit">
                {loading ? (
                  <span className="login-spinner-wrap">
                    <span className="login-spinner"></span>
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In
                    <span className="login-submit-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            <p className="login-register-link">
              {t('auth.noAccount')}{' '}
              <Link to="/register">{t('auth.register')}</Link>
            </p>

            {/* Demo Credentials */}
            <div className="login-demo">
              <div className="login-demo-divider">
                <span>Quick Demo Login</span>
              </div>
              <div className="login-demo-grid">
                {demoCredentials.map((demo) => (
                  <button
                    key={demo.role}
                    onClick={() => { setEmail(demo.email); setPassword(demo.pass); }}
                    className="login-demo-btn"
                    type="button"
                  >
                    <span className="login-demo-icon">{demo.icon}</span>
                    <span className="login-demo-role">{demo.role}</span>
                    <span className="login-demo-desc">{demo.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a1a;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        .login-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: float 8s ease-in-out infinite;
        }

        .login-bg-orb-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(233, 69, 96, 0.15), transparent);
          top: -100px;
          right: -100px;
          animation-delay: 0s;
        }

        .login-bg-orb-2 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(212, 168, 83, 0.12), transparent);
          bottom: -80px;
          left: -80px;
          animation-delay: -3s;
        }

        .login-bg-orb-3 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(29, 111, 164, 0.12), transparent);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -5s;
        }

        .login-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }

        .login-container {
          position: relative;
          z-index: 1;
          display: flex;
          width: 100%;
          max-width: 1000px;
          min-height: 600px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03),
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 120px rgba(233, 69, 96, 0.05);
        }

        /* ─── Left Brand Panel ─── */
        .login-brand-panel {
          flex: 1;
          background: linear-gradient(160deg, #12122a 0%, #1a1a35 50%, #0f1525 100%);
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .login-brand-panel::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(233,69,96,0.3), rgba(212,168,83,0.3), transparent);
        }

        .login-brand-panel::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 70% 30%, rgba(233,69,96,0.06), transparent 50%);
          pointer-events: none;
        }

        .login-brand-content {
          position: relative;
          z-index: 1;
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 48px;
        }

        .login-logo-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(233,69,96,0.15), rgba(212,168,83,0.15));
          border: 1px solid rgba(233,69,96,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          box-shadow: 0 0 24px rgba(233,69,96,0.15);
        }

        .login-logo-icon svg {
          width: 100%;
          height: 100%;
        }

        .login-logo-text {
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #e94560, #d4a853);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .login-logo-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .login-features {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-feature {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.3s ease;
        }

        .login-feature:hover {
          background: rgba(233, 69, 96, 0.05);
          border-color: rgba(233, 69, 96, 0.15);
          transform: translateX(4px);
        }

        .login-feature-icon {
          font-size: 22px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .login-feature h3 {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 3px;
        }

        .login-feature p {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
        }

        .login-brand-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .login-brand-footer p {
          font-size: 11px;
          color: #475569;
          letter-spacing: 0.3px;
        }

        /* ─── Right Form Panel ─── */
        .login-form-panel {
          flex: 1;
          background: #111125;
          padding: 48px 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-form-wrapper {
          width: 100%;
          max-width: 360px;
        }

        .login-form-header {
          margin-bottom: 32px;
        }

        .login-form-header h2 {
          font-size: 26px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 8px;
        }

        .login-form-header p {
          font-size: 14px;
          color: #64748b;
        }

        .login-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 20px;
          color: #f87171;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          margin-bottom: 8px;
        }

        .login-input-wrap {
          position: relative;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          pointer-events: none;
        }

        .login-input-wrap input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 13px 16px 13px 42px;
          color: #f1f5f9;
          font-size: 14px;
          outline: none;
          transition: all 0.25s ease;
        }

        .login-input-wrap input::placeholder {
          color: #475569;
        }

        .login-input-wrap input:focus {
          border-color: rgba(233, 69, 96, 0.5);
          box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.1), 0 0 20px rgba(233, 69, 96, 0.05);
          background: rgba(255, 255, 255, 0.05);
        }

        .login-submit {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #e94560, #c7384c);
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
          position: relative;
          overflow: hidden;
        }

        .login-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255,255,255,0.1), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }

        .login-submit:hover::before {
          transform: translateX(100%);
        }

        .login-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(233, 69, 96, 0.35);
        }

        .login-submit:active {
          transform: translateY(0);
        }

        .login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .login-submit-arrow {
          transition: transform 0.3s ease;
          font-size: 18px;
        }

        .login-submit:hover .login-submit-arrow {
          transform: translateX(4px);
        }

        .login-spinner-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .login-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-register-link {
          text-align: center;
          font-size: 13px;
          color: #64748b;
          margin-top: 24px;
        }

        .login-register-link a {
          color: #e94560;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .login-register-link a:hover {
          color: #f87171;
        }

        /* ─── Demo Section ─── */
        .login-demo {
          margin-top: 28px;
        }

        .login-demo-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .login-demo-divider::before,
        .login-demo-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent);
        }

        .login-demo-divider span {
          font-size: 11px;
          color: #475569;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 500;
        }

        .login-demo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .login-demo-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 8px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.3s ease;
          color: inherit;
        }

        .login-demo-btn:hover {
          border-color: rgba(233, 69, 96, 0.3);
          background: rgba(233, 69, 96, 0.06);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .login-demo-icon {
          font-size: 22px;
        }

        .login-demo-role {
          font-size: 12px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .login-demo-desc {
          font-size: 10px;
          color: #475569;
        }
      `}</style>
    </div>
  );
}
