import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { getStats } from '../../services/stats.service.js';
import { deleteFamily } from '../../services/family.service.js';
import AddFamilyModal from '../../components/families/AddFamilyModal.jsx';
import DashboardCharts from '../../components/dashboard/DashboardCharts.jsx';
import AppNavbar from '../../components/AppNavbar.jsx';

const IconUsers = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconAlert = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const IconVisits = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
const IconSearch = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconPencil = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

function StatusBadge({ status }) {
  const isUrgent = status === 'URGENT';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isUrgent ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200' : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
      }`}
    >
      {status}
    </span>
  );
}

function Dashboard() {
  const { t } = useTranslation();
  useAuth();
  const [families, setFamilies] = useState([]);
  const [visits, setVisits] = useState([]);
  const [visitsCount, setVisitsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [familyToEdit, setFamilyToEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalFamilies = families.length;
  const urgentFamilies = families.filter((f) => f.status === 'URGENT').length;

  const filteredFamilies = families.filter((f) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (f.name || '').toLowerCase();
    const address = (f.address || '').toLowerCase();
    return name.includes(q) || address.includes(q);
  });

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const res = await getStats();
      const data = res.data || {};
      setFamilies(data.families || []);
      const visitsList = data.visits || [];
      setVisits(visitsList);
      setVisitsCount(data.visitsCount ?? visitsList.filter((v) => v.status === 'COMPLETED' || !v.status).length);
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteFamily = async (family) => {
    if (!window.confirm(t('dashboard.deleteFamilyConfirm', { name: family.name }))) return;
    try {
      await deleteFamily(family._id);
      setLoading(true);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('dashboard.deleteError'));
    }
  };

  const handleOpenAdd = () => {
    setFamilyToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (family) => {
    setFamilyToEdit(family);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFamilyToEdit(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppNavbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('dashboard.title')}</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/alerts"
              className="inline-flex items-center justify-center min-h-[44px] gap-1.5 px-4 py-3 text-sm font-medium text-white bg-red-600 dark:bg-red-500 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 shrink-0 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              aria-label={urgentFamilies > 0 ? (urgentFamilies > 1 ? t('dashboard.alertsUrgents', { count: urgentFamilies }) : t('dashboard.alertsUrgent', { count: urgentFamilies })) : t('dashboard.alerts')}
            >
              <span aria-hidden>🔔</span> {t('dashboard.alerts')}
              {urgentFamilies > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-white/25 text-xs font-bold">
                  {urgentFamilies}
                </span>
              )}
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 shrink-0 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              aria-label={t('dashboard.viewMap')}
            >
              <span aria-hidden>🌍</span> {t('dashboard.viewMap')}
            </Link>
            <Link
              to="/inventory"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 text-sm font-medium text-white bg-slate-600 dark:bg-slate-500 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 shrink-0 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              aria-label={t('dashboard.stocks')}
            >
              <span aria-hidden>📦</span> {t('dashboard.stocks')}
            </Link>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 shrink-0 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              aria-label={t('dashboard.addFamily')}
            >
              {t('dashboard.addFamily')}
            </button>
          </div>
        </div>

        <AddFamilyModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={() => {
            setLoading(true);
            loadData();
          }}
          initialData={familyToEdit}
        />

        {!loading && !error && families.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <IconUsers />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.totalFamilies')}</p>
                <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{totalFamilies}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                <IconAlert />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.urgentFamilies')}</p>
                <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{urgentFamilies}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <IconVisits />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.visitsCompleted')}</p>
                <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{visitsCount}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && families.length > 0 && (
          <DashboardCharts families={families} visits={visits} />
        )}

        {!loading && !error && families.length > 0 && (
          <div className="mb-4">
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <IconSearch />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('dashboard.searchFamily')}
                className="w-full min-h-[44px] pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-slate-900 text-sm"
                aria-label={t('dashboard.searchFamilyLabel')}
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && families.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-12 text-center text-slate-600 dark:text-slate-400">
            {t('dashboard.noFamilies')}
          </div>
        )}

        {!loading && !error && families.length > 0 && (
          <>
            {/* Vue cartes mobile (< 768px) */}
            <div className="block md:hidden space-y-3">
              {filteredFamilies.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-8 text-center text-slate-600 dark:text-slate-400 text-sm">
                  {t('dashboard.noFamilyMatch')}
                </div>
              ) : (
                filteredFamilies.map((family) => (
                  <div
                    key={family._id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Link
                        to={`/families/${family._id}`}
                        className="text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded min-h-[44px] inline-flex items-center"
                      >
                        {family.name}
                      </Link>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(family)}
                          className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600"
                          title={t('dashboard.edit')}
                          aria-label={t('dashboard.edit')}
                        >
                          <IconPencil />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFamily(family)}
                          className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg focus-visible:ring-2 focus-visible:ring-red-600"
                          title={t('dashboard.delete')}
                          aria-label={t('dashboard.delete')}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{family.address || t('dashboard.dash')}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={family.status} />
                      {family.needs?.length > 0 && (
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {family.needs.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Vue tableau tablette+ (≥ 768px) */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('dashboard.tableName')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('dashboard.tableAddress')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('dashboard.tableStatus')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('dashboard.tableNeeds')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('dashboard.tableActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  {filteredFamilies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-600 dark:text-slate-400 text-sm">
                        {t('dashboard.noFamilyMatch')}
                      </td>
                    </tr>
                  ) : (
                    filteredFamilies.map((family) => (
                      <tr key={family._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3">
                          <Link
                            to={`/families/${family._id}`}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded min-h-[44px] inline-flex items-center"
                          >
                            {family.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{family.address || t('dashboard.dash')}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={family.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {family.needs?.length > 0 ? family.needs.join(', ') : t('dashboard.dash')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(family)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600"
                              title={t('dashboard.edit')}
                              aria-label={t('dashboard.edit')}
                            >
                              <IconPencil />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFamily(family)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg focus-visible:ring-2 focus-visible:ring-red-600"
                              title={t('dashboard.delete')}
                              aria-label={t('dashboard.delete')}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
