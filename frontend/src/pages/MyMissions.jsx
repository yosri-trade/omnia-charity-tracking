import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyVisits } from '../services/visit.service.js';
import Sidebar from '../components/Sidebar.jsx';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  const planned = visits.filter((v) => v.status === 'PLANNED');
  const completed = visits.filter((v) => v.status === 'COMPLETED' || !v.status);

  const isAssignedToMe = (v) => {
    const list = v.assignedTo || [];
    if (list.length === 0) return false;
    const myId = String(user?.id ?? '');
    return list.some((u) => String(u?._id ?? u) === myId);
  };
  const isOpenMission = (v) => !v.assignedTo?.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-800">Mes Missions</h1>
            <Sidebar role={user?.role} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{user?.name}</span>
            <button
              type="button"
              onClick={() => { logout(); navigate('/login', { replace: true }); }}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Visites à réaliser</h2>
            {planned.length === 0 ? (
              <p className="text-slate-500 text-sm mb-8">Aucune visite planifiée.</p>
            ) : (
              <div className="grid gap-4 mb-10">
                {planned.map((v) => (
                  <div
                    key={v._id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium text-slate-800">
                        Visite prévue — {v.family?.name || 'Famille'}
                      </p>
                      {isAssignedToMe(v) ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Mission Assignée
                        </span>
                      ) : isOpenMission(v) ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Mission Ouverte
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {formatDate(v.date)}
                      {v.family?.address && ` · ${v.family.address}`}
                    </p>
                    <Link
                      to={`/visits/${v._id}/checkin`}
                      className="mt-4 inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Démarrer Mission
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-lg font-semibold text-slate-800 mb-4">Visites réalisées</h2>
            {completed.length === 0 ? (
              <p className="text-slate-500 text-sm">Aucune visite réalisée.</p>
            ) : (
              <div className="space-y-3">
                {completed.slice(0, 10).map((v) => {
                  const types = v.types || [];
                  const address = v.family?.address || '';
                  const shortAddress = address.length > 40 ? `${address.slice(0, 37)}…` : address;
                  return (
                    <div
                      key={v._id}
                      className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircleIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {v.family?.name || 'Famille'}
                        </p>
                        <p className="text-sm text-gray-500 truncate" title={address}>
                          {shortAddress || '—'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {types.slice(0, 3).map((t) => {
                            const style = TYPE_STYLES[t] || TYPE_STYLES.Autre;
                            return (
                              <span
                                key={t}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}
                              >
                                {style.emoji} {style.label}
                              </span>
                            );
                          })}
                        </div>
                        <span className="text-xs text-gray-400">
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
