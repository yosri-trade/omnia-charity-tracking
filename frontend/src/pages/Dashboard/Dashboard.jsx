import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getStats } from '../../services/stats.service.js';
import { deleteFamily } from '../../services/family.service.js';
import AddFamilyModal from '../../components/families/AddFamilyModal.jsx';
import DashboardCharts from '../../components/dashboard/DashboardCharts.jsx';
import Sidebar from '../../components/Sidebar.jsx';

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
        isUrgent ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
      }`}
    >
      {status}
    </span>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteFamily = async (family) => {
    if (!window.confirm(`Supprimer la famille « ${family.name} » ?`)) return;
    try {
      await deleteFamily(family._id);
      setLoading(true);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur lors de la suppression.');
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

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Bienvenue {user?.name || 'Utilisateur'}
              </h1>
              <p className="text-sm text-slate-500">OMNIA Charity Tracking</p>
            </div>
            <Sidebar role={user?.role} />
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Familles bénéficiaires</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/alerts"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shrink-0"
            >
              🔔 Alertes
              {urgentFamilies > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-white/25 text-xs font-bold">
                  {urgentFamilies}
                </span>
              )}
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shrink-0"
            >
              🌍 Voir la Carte
            </Link>
            <Link
              to="/inventory"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-lg hover:bg-slate-700 shrink-0"
            >
              📦 Stocks
            </Link>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shrink-0"
            >
              Ajouter une famille
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <IconUsers />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Familles</p>
                <p className="text-2xl font-semibold text-slate-800">{totalFamilies}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                <IconAlert />
              </div>
              <div>
                <p className="text-sm text-slate-500">Familles Urgentes</p>
                <p className="text-2xl font-semibold text-slate-800">{urgentFamilies}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <IconVisits />
              </div>
              <div>
                <p className="text-sm text-slate-500">Visites Réalisées</p>
                <p className="text-2xl font-semibold text-slate-800">{visitsCount}</p>
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
                placeholder="Rechercher une famille..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && families.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            Aucune famille enregistrée
          </div>
        )}

        {!loading && !error && families.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Adresse
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Besoins
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredFamilies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                        Aucune famille ne correspond à la recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredFamilies.map((family) => (
                      <tr key={family._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link
                            to={`/families/${family._id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {family.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{family.address || '—'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={family.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {family.needs?.length > 0 ? family.needs.join(', ') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(family)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Modifier"
                            >
                              <IconPencil />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFamily(family)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Supprimer"
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
        )}
      </main>
    </div>
  );
}

export default Dashboard;
