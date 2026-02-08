import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Sidebar from './Sidebar.jsx';

function HamburgerIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function SunIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function MoonIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

/**
 * Barre de navigation commune à toutes les pages authentifiées.
 * Affiche : Bienvenue + nom, OMNIA Charity Tracking, liens (Sidebar), thème, Déconnexion.
 */
export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <header className="bg-white dark:bg-slate-900 border-t-2 border-t-red-700 dark:border-t-red-600 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-6xl mx-auto safe-area-header flex flex-col gap-3">
        {/* Ligne 1 : Titre (2 lignes de texte) + boutons thème / déconnexion */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 leading-tight">
              {t('app.welcome')} {user?.name || t('app.user')}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('app.name')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
              title={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              aria-label={t('app.logout')}
            >
              {t('app.logout')}
            </button>
          </div>
        </div>
        {/* Ligne 2 : Liens de navigation (tablette+) ou hamburger (mobile) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Bouton hamburger mobile (< 768px) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="md:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            aria-label={t('nav.openMenu')}
            aria-expanded={drawerOpen}
          >
            <HamburgerIcon className="w-6 h-6" />
          </button>
          {/* Navigation inline tablette+ (≥ 768px) */}
          <div className="hidden md:block">
            <Sidebar role={user?.role} />
          </div>
        </div>
      </div>

      {/* Drawer mobile */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm md:hidden"
            onClick={closeDrawer}
            onKeyDown={(e) => e.key === 'Escape' && closeDrawer()}
            aria-hidden="true"
          />
          <aside
            className={`fixed inset-y-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-slate-800 shadow-xl md:hidden flex flex-col transition-transform duration-200 ease-out start-0 ${
              drawerOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.closeMenu')}
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)',
            }}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-600">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('app.name')}</span>
              <button
                type="button"
                onClick={closeDrawer}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                aria-label={t('nav.closeMenu')}
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Sidebar role={user?.role} onLinkClick={closeDrawer} vertical />
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
