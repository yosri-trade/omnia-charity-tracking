import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getAlerts } from '../services/alert.service.js';
import AddVisitModal from '../components/families/AddVisitModal.jsx';
import Sidebar from '../components/Sidebar.jsx';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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

function Alerts() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement.');
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-800">Centre d&apos;Opérations</h1>
            <Sidebar role={user?.role} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user?.name}</span>
            <button
              onClick={() => { logout(); navigate('/login', { replace: true }); }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panneau principal : Urgences (rouge) + Oubliées (orange) */}
            <section className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    🚨 FAMILLES NÉGLIGÉES
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-sm font-medium bg-red-200 text-red-900">
                      {urgentFamilies.length}
                    </span>
                    <span className="text-slate-400">+</span>
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-sm font-medium bg-amber-200 text-amber-900">
                      {forgottenFamilies.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Urgences vitales (rouge) · Pas vue depuis 30j+ (orange)
                  </p>
                </div>
                <div className="p-4 space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
                  {mergedFamilies.length === 0 ? (
                    <p className="text-slate-500 text-sm py-6 text-center">
                      Aucune famille négligée.
                    </p>
                  ) : (
                    mergedFamilies.map((f) => {
                      const isUrgent = f.alertType === 'urgent';
                      return (
                        <div
                          key={f._id}
                          className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border transition-colors ${
                            isUrgent
                              ? 'border-red-200 bg-red-50/40 hover:bg-red-50/60'
                              : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/60'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-800 truncate">{f.name}</h3>
                              {isUrgent ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-200 text-red-900">
                                  🚨 URGENT
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-200 text-amber-900">
                                  ⚠️ Pas vue depuis 30j+
                                </span>
                              )}
                            </div>
                            {f.address && (
                              <p className="text-sm text-slate-600 truncate">{f.address}</p>
                            )}
                            {!isUrgent && (
                              <p className="mt-1 text-xs text-amber-800">
                                Dernière visite : {f.lastVisitDate ? formatDate(f.lastVisitDate) : 'Jamais'}
                              </p>
                            )}
                            {f.needs?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {f.needs.slice(0, 3).map((n) => (
                                  <span
                                    key={n}
                                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                      isUrgent ? 'bg-red-200/60 text-red-900' : 'bg-amber-200/60 text-amber-900'
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
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                              Voir dossier
                            </Link>
                            <button
                              type="button"
                              onClick={() => handlePlanVisit(f)}
                              className={`inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm ${
                                isUrgent
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-amber-600 hover:bg-amber-700'
                              }`}
                            >
                              📅 Planifier Visite
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            {/* Colonne droite : Stock + Retours bénévoles */}
            <div className="flex flex-col gap-6">
              {/* Ruptures de stock */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    📦 RUPTURES DE STOCK
                  </h2>
                </div>
                <div className="p-3 min-h-[8rem]">
                  {lowStockItems.length === 0 ? (
                    <p className="text-sm text-green-700 font-medium py-4 text-center">
                      ✅ Stocks OK
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {lowStockItems.map((item) => (
                        <li
                          key={item._id}
                          className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-red-50 border border-red-100 text-sm"
                        >
                          <span className="font-medium text-red-900 truncate">{item.name}</span>
                          <span className="text-red-700 shrink-0">
                            {item.quantity} / {item.minThreshold} {item.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* Retours bénévoles */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 min-h-0">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    🗣️ RETOURS BÉNÉVOLES
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">3 dernières visites réalisées</p>
                </div>
                <div className="p-3 space-y-3 max-h-[18rem] overflow-y-auto">
                  {recentReports.length === 0 ? (
                    <p className="text-slate-500 text-sm py-4 text-center">
                      Aucun retour récent.
                    </p>
                  ) : (
                    recentReports.map((r) => (
                      <div
                        key={r._id}
                        className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-slate-800 truncate">
                            {r.familyName}
                          </span>
                          <span className="text-xs text-slate-400 shrink-0">
                            {formatRelativeDate(r.date)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{r.volunteerName}</p>
                        <p className="text-slate-600 mt-1 line-clamp-3">
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
