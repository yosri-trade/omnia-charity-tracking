import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { createUser } from '../services/user.service.js';
import AppNavbar from '../components/AppNavbar.jsx';

const ROLES = [
  { value: 'VOLUNTEER', labelKey: 'users.roleVolunteer' },
  { value: 'COORDINATOR', labelKey: 'users.roleCoordinator' },
  { value: 'ADMIN', labelKey: 'users.roleAdmin' },
];

function Users() {
  const { t } = useTranslation();
  useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('VOLUNTEER');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      await createUser({ name, email, password, role });
      setMessage(t('users.created'));
      setName('');
      setEmail('');
      setPassword('');
      setRole('VOLUNTEER');
    } catch (err) {
      setMessage(err.response?.data?.error || err.message || t('users.error'));
    } finally {
      setLoading(false);
    }
  };

  const isError = message && message !== t('users.created');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppNavbar />
      <main className="max-w-md mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-4">{t('users.createUser')}</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="user-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('users.name')}</label>
              <input
                id="user-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-slate-800"
              />
            </div>
            <div>
              <label htmlFor="user-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('users.email')}</label>
              <input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-slate-800"
              />
            </div>
            <div>
              <label htmlFor="user-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('users.password')}</label>
              <input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-slate-800"
              />
            </div>
            <div>
              <label htmlFor="user-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('users.role')}</label>
              <select
                id="user-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-slate-800"
                aria-required="true"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{t(r.labelKey)}</option>
                ))}
              </select>
            </div>
          </div>
          {message && (
            <p className={`mt-4 text-sm ${isError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full min-h-[44px] py-3 px-4 font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
          >
            {loading ? t('users.creating') : t('users.create')}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Users;
