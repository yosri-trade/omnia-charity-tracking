import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { getAlerts } from '../services/alert.service.js';
import AddVisitModal from '../components/families/AddVisitModal.jsx';
import AppNavbar from '../components/AppNavbar.jsx';

function formatDate(dateStr, locale = 'fr-FR') {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatRelativeDate(d, t) {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return t('common.instant');
  if (diffMins < 60) return t('common.minutesAgo', { count: diffMins });
  if (diffHours < 24) return t('common.hoursAgo', { count: diffHours });
  if (diffDays === 1) return t('common.yesterday');
  if (diffDays < 7) return t('common.daysAgo', { count: diffDays });
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function Alerts() {
  const { t, i18n } = useTranslation();
  useAuth();
  const [urgentFamilies, setUrgentFamilies] = useState([]);
  const [forgottenFamilies, setForgottenFamilies] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      setError(null);
      const res = await getAlerts();
      const data = res.data || res;
      setUrgentFamilies(data.urgentFamilies || []);
      setForgottenFamilies(data.forgottenFamilies || []);
      setLowStockItems(data.lowStockItems || []);
      setRecentReports(data.recentReports || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('alerts.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handlePlanVisit = (family) => {
    setSelectedFamily(family);
    setIsModalOpen(true);
  };

  const handleVisitSuccess = () => {
    setIsModalOpen(false);
    setSelectedFamily(null);
    setLoading(true);
    loadAlerts();
  };

  const mergedFamilies = [
    ...urgentFamilies.map((f) => ({ ...f, alertType: 'urgent' })),
    ...forgottenFamilies.map((f) => ({ ...f, alertType: 'forgotten' })),
  ];

  const locale = i18n.language === 'ar' ? 'ar-TN' : i18n.language === 'en' ? 'en-US' : 'fr-FR';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppNavbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-red-500 dark:border-red-400 border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    🚨 {t('alerts.title')}
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-sm font-medium bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-200">
                      {urgentFamilies.length}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">+</span>
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-sm font-medium bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200">
                      {forgottenFamilies.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('alerts.subtitle')}
                  </p>
                </div>
                <div className="p-4 space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
                  {mergedFamilies.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm py-6 text-center">
                      {t('alerts.noNeglected')}
                    </p>
                  ) : (
                    mergedFamilies.map((f) => {
                      const isUrgent = f.alertType === 'urgent';
                      return (
                        <div
                          key={f._id}
                          className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border transition-colors ${
                            isUrgent
                              ? 'border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-900/20 hover:bg-red-50/60 dark:hover:bg-red-900/30'
                              : 'border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-900/20 hover:bg-amber-50/60 dark:hover:bg-amber-900/30'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{f.name}</h3>
                              {isUrgent ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-200">
                                  🚨 {t('alerts.urgentLabel')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200">
                                  ⚠️ {t('alerts.forgottenLabel')}
                                </span>
                              )}
                            </div>
                            {f.address && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{f.address}</p>
                            )}
                            {!isUrgent && (
                              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                                {t('alerts.lastVisit')} {f.lastVisitDate ? formatDate(f.lastVisitDate, locale) : t('alerts.lastVisitNever')}
                              </p>
                            )}
                            {f.needs?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {f.needs.slice(0, 3).map((n) => (
                                  <span
                                    key={n}
                                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                      isUrgent ? 'bg-red-200/60 dark:bg-red-900/40 text-red-900 dark:text-red-200' : 'bg-amber-200/60 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200'
                                    }`}
                                  >
                                    {n}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              to={`/families/${f._id}`}
                              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
                            >
                              {t('alerts.viewDossier')}
                            </Link>
                            <button
                              type="button"
                              onClick={() => handlePlanVisit(f)}
                              className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 py-3 text-sm font-semibold text-white rounded-lg shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
                                isUrgent
                                  ? 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600'
                                  : 'bg-amber-600 dark:bg-amber-500 hover:bg-amber-700 dark:hover:bg-amber-600'
                              }`}
                              aria-label={t('alerts.planVisitFor', { name: f.name })}
                            >
                              <span aria-hidden>📅</span> {t('alerts.planVisit')}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-6">
              <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    📦 {t('alerts.stockShortages')}
                  </h2>
                </div>
                <div className="p-3 min-h-[8rem]">
                  {lowStockItems.length === 0 ? (
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium py-4 text-center">
                      ✅ {t('alerts.stocksOk')}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {lowStockItems.map((item) => (
                        <li
                          key={item._id}
                          className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-sm"
                        >
                          <span className="font-medium text-red-900 dark:text-red-200 truncate">{item.name}</span>
                          <span className="text-red-700 dark:text-red-300 shrink-0">
                            {item.quantity} / {item.minThreshold} {item.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden flex-1 min-h-0">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    🗣️ {t('alerts.volunteerReports')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('alerts.lastVisits')}</p>
                </div>
                <div className="p-3 space-y-3 max-h-[18rem] overflow-y-auto">
                  {recentReports.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm py-4 text-center">
                      {t('alerts.noRecentReports')}
                    </p>
                  ) : (
                    recentReports.map((r) => (
                      <div
                        key={r._id}
                        className="p-3 rounded-lg border border-slate-100 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {r.familyName}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                            {formatRelativeDate(r.date, t)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{r.volunteerName}</p>
                        <p className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">
                          {r.notes || '—'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <AddVisitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFamily(null);
        }}
        familyId={selectedFamily?._id}
        familyStatus={selectedFamily?.status}
        familyCoordinates={selectedFamily?.coordinates}
        onSuccess={handleVisitSuccess}
      />
    </div>
  );
}

export default Alerts;
