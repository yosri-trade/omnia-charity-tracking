import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyVisits } from '../services/visit.service.js';
import AppNavbar from '../components/AppNavbar.jsx';

const ASSIGNED_DISPLAY_LIMIT = 3;

function formatDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(d) {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const TYPE_STYLES = {
  Alimentaire: { bg: 'bg-pink-100', text: 'text-pink-800', label: 'Alimentaire', emoji: '🍎' },
  Médical: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Médical', emoji: '💊' },
  Social: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Social', emoji: '🤝' },
  Autre: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Autre', emoji: '📦' },
};

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MyMissions() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyVisits()
      .then((res) => {
        if (!cancelled) setVisits(res.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || err.message || 'Erreur chargement');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const [showAllAssigned, setShowAllAssigned] = useState(false);

  const planned = visits.filter((v) => v.status === 'PLANNED');
  const completed = visits.filter((v) => v.status === 'COMPLETED' || !v.status);

  const isAssignedToMe = (v) => {
    const list = v.assignedTo || [];
    if (list.length === 0) return false;
    const myId = String(user?.id ?? '');
    return list.some((u) => String(u?._id ?? u) === myId);
  };
  const isOpenMission = (v) => !v.assignedTo?.length;

  const openMissions = useMemo(
    () => planned.filter((v) => isOpenMission(v)),
    [planned]
  );
  const assignedMissionsSorted = useMemo(
    () =>
      [...planned.filter((v) => isAssignedToMe(v))].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
    [planned]
  );
  const assignedDisplayed = showAllAssigned
    ? assignedMissionsSorted
    : assignedMissionsSorted.slice(0, ASSIGNED_DISPLAY_LIMIT);
  const hasMoreAssigned = assignedMissionsSorted.length > ASSIGNED_DISPLAY_LIMIT;

  const MissionCard = ({ v }) => (
    <div
      key={v._id}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <p className="font-medium text-slate-800 dark:text-slate-100">
          {t('missions.visitPlanned')} — {v.family?.name || t('missions.family')}
        </p>
        {isAssignedToMe(v) ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
            {t('missions.missionAssigned')}
          </span>
        ) : isOpenMission(v) ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
            {t('missions.missionOpen')}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
        {formatDate(v.date)}
        {v.family?.address && ` · ${v.family.address}`}
      </p>
      <Link
        to={`/visits/${v._id}/checkin`}
        className="mt-4 inline-flex items-center justify-center min-h-[44px] w-full sm:w-auto px-6 py-3 text-base font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
      >
        {t('missions.startMission')}
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppNavbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <span aria-hidden>🟢</span> {t('missions.open')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {t('missions.openDesc')}
            </p>
            {openMissions.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-600 px-4 py-3">
                {t('missions.noOpen')}
              </p>
            ) : (
              <div className="grid gap-4 mb-10">
                {openMissions.map((v) => (
                  <MissionCard key={v._id} v={v} />
                ))}
              </div>
            )}

            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2 mt-2">
              <span aria-hidden>🔵</span> {t('missions.assigned')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {t('missions.assignedDesc')}
            </p>
            {assignedMissionsSorted.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-600 px-4 py-3">
                {t('missions.noAssigned')}
              </p>
            ) : (
              <>
                <div className="grid gap-4 mb-4">
                  {assignedDisplayed.map((v) => (
                    <MissionCard key={v._id} v={v} />
                  ))}
                </div>
                {hasMoreAssigned && (
                  <div className="mb-8">
                    <button
                      type="button"
                      onClick={() => setShowAllAssigned((prev) => !prev)}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded px-2 py-2"
                      aria-expanded={showAllAssigned}
                      aria-label={showAllAssigned ? t('missions.reduce') : t('missions.seeAll')}
                    >
                      {showAllAssigned
                        ? t('missions.reduce')
                        : `${t('missions.seeAll')} (${assignedMissionsSorted.length})`}
                    </button>
                  </div>
                )}
              </>
            )}

            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 mt-10">{t('missions.completed')}</h2>
            {completed.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-sm">{t('missions.noCompleted')}</p>
            ) : (
              <div className="space-y-3">
                {completed.slice(0, 10).map((v) => {
                  const types = v.types || [];
                  const address = v.family?.address || '';
                  const shortAddress = address.length > 40 ? `${address.slice(0, 37)}…` : address;
                  return (
                    <div
                      key={v._id}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-600 shadow-sm"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                        <CheckCircleIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {v.family?.name || t('missions.family')}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate" title={address}>
                          {shortAddress || '—'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {types.slice(0, 3).map((typeKey) => {
                            const style = TYPE_STYLES[typeKey] || TYPE_STYLES.Autre;
                            return (
                              <span
                                key={typeKey}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}
                              >
                                {style.emoji} {style.label}
                              </span>
                            );
                          })}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {formatRelativeDate(v.date)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {completed.length > 10 && (
                  <p className="text-gray-400 text-sm py-2">… et {completed.length - 10} autres</p>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default MyMissions;
