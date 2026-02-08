import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MENU = [
  { path: '/', labelKey: 'nav.dashboard', roles: ['ADMIN', 'COORDINATOR'] },
  { path: '/alerts', labelKey: 'nav.alerts', roles: ['ADMIN', 'COORDINATOR'] },
  { path: '/map', labelKey: 'nav.map', roles: ['ADMIN', 'COORDINATOR'] },
  { path: '/inventory', labelKey: 'nav.inventory', roles: ['ADMIN', 'COORDINATOR'] },
  { path: '/users', labelKey: 'nav.users', roles: ['ADMIN'] },
  { path: '/my-missions', labelKey: 'nav.myMissions', roles: ['ADMIN', 'COORDINATOR', 'VOLUNTEER'] },
  { path: '/settings', labelKey: 'nav.settings', roles: ['ADMIN', 'COORDINATOR', 'VOLUNTEER'] },
];

const LANGUAGES = [
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'الع' },
  { code: 'en', label: 'EN' },
];

export default function Sidebar({ role, onLinkClick, vertical }) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const allowed = MENU.filter((item) => item.roles.includes(role));

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    if (typeof window !== 'undefined') localStorage.setItem('omnia-lang', code);
  };

  const handleLinkClick = () => {
    onLinkClick?.();
  };

  const linkClass = (isActive) =>
    `inline-flex items-center min-h-[44px] min-w-[44px] px-4 py-3 rounded-lg text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
      isActive
        ? 'bg-slate-200 text-slate-900 dark:bg-slate-600 dark:text-slate-100'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100'
    }`;

  return (
    <div className={`flex gap-2 ${vertical ? 'flex-col' : 'flex-wrap items-center'}`}>
      <nav className={`flex gap-2 ${vertical ? 'flex-col' : 'flex-wrap items-center'}`}>
        {allowed.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={linkClass(isActive)}
            >
              {item.path === '/alerts' && <span aria-hidden>🔔</span>}
              {item.path === '/map' && <span aria-hidden>🌍</span>}
              {item.path === '/inventory' && <span aria-hidden>📦</span>}
              {item.path === '/users' && <span aria-hidden>👥</span>}
              {item.path === '/my-missions' && <span aria-hidden>🎯</span>}
              {item.path === '/settings' && <span aria-hidden>⚙️</span>}
              <span className={item.path !== '/' ? 'ms-1' : ''}>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
      <div className={`flex items-center gap-1 border border-slate-200 dark:border-slate-600 rounded-lg p-1 bg-slate-50 dark:bg-slate-800 ${vertical ? 'self-start mt-2' : ''}`} role="group" aria-label="Langue">
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => changeLang(code)}
            className={`min-h-[36px] min-w-[36px] px-2 rounded text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              i18n.language === code
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-600'
            }`}
            title={code === 'fr' ? 'Français' : code === 'ar' ? 'العربية' : 'English'}
            aria-label={code === 'fr' ? 'Français' : code === 'ar' ? 'العربية' : 'English'}
            aria-pressed={i18n.language === code}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
