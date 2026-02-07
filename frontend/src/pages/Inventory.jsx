import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getAllItems, createItem, updateStock, deleteItem } from '../services/item.service.js';

const CATEGORY_ICONS = {
  Alimentaire: '🍎',
  Médical: '💊',
  Vêtements: '👕',
  Hygiène: '🧴',
  Scolaire: '📚',
  Autre: '📦',
};

const CATEGORY_OPTIONS = [
  { value: 'Alimentaire', label: 'Alimentaire' },
  { value: 'Médical', label: 'Médical' },
  { value: 'Vêtements', label: 'Vêtements' },
  { value: 'Hygiène', label: 'Hygiène' },
  { value: 'Scolaire', label: 'Scolaire' },
  { value: 'Autre', label: 'Autre' },
];

function ItemCard({ item, onAdd, onRemove, onDelete, loadingId }) {
  const qty = item.quantity ?? 0;
  const threshold = item.minThreshold ?? 10;
  const isLow = qty < threshold;
  const maxForBar = Math.max(threshold, qty, 1);
  const percent = Math.min(100, (qty / maxForBar) * 100);

  const icon = CATEGORY_ICONS[item.category] || '📦';

  return (
    <div
      className={`rounded-xl border-2 p-5 shadow-sm transition-shadow hover:shadow-md ${
        isLow ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl shrink-0" aria-hidden>
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-800 truncate">{item.name}</h3>
            <p className="text-xs text-slate-500">{item.category} · {item.unit}</p>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
            isLow ? 'bg-red-200 text-red-900' : 'bg-green-200 text-green-900'
          }`}
        >
          {isLow ? '⚠️ PÉNURIE' : 'EN STOCK'}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600">
            {qty} {item.unit}
          </span>
          <span className="text-slate-500">Seuil: {threshold}</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isLow ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onAdd(item._id)}
            disabled={loadingId === item._id}
            className="w-10 h-10 rounded-full bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center text-lg font-bold disabled:opacity-50"
            title="Ajouter du stock"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => onRemove(item._id)}
            disabled={loadingId === item._id || qty <= 0}
            className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            title="Retirer du stock"
          >
            −
          </button>
        </div>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="text-xs text-slate-400 hover:text-red-600"
          title="Supprimer l'article"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

function AddItemModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Alimentaire');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('pièces');
  const [minThreshold, setMinThreshold] = useState(10);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Le nom est requis.');
      return;
    }
    setSubmitting(true);
    try {
      await createItem({
        name: name.trim(),
        category,
        quantity: Number(quantity) || 0,
        unit: unit.trim() || 'pièces',
        minThreshold: Number(minThreshold) ?? 10,
      });
      onSuccess?.();
      onClose?.();
      setName('');
      setCategory('Alimentaire');
      setQuantity(0);
      setUnit('pièces');
      setMinThreshold(10);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Erreur lors de l'ajout.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Nouvel article</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="ex: Lait, Couches"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantité</label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unité</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="kg, boîtes..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Seuil d'alerte (min)</label>
            <input
              type="number"
              min={0}
              value={minThreshold}
              onChange={(e) => setMinThreshold(Number(e.target.value) ?? 10)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Inventory() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      setError(null);
      const res = await getAllItems();
      setItems(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleAdd = async (id) => {
    setLoadingId(id);
    try {
      const res = await updateStock(id, 1);
      setItems((prev) => prev.map((i) => (i._id === id ? res.data : i)));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (id) => {
    setLoadingId(id);
    try {
      const res = await updateStock(id, -1);
      setItems((prev) => prev.map((i) => (i._id === id ? res.data : i)));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Supprimer « ${item.name} » ?`)) return;
    try {
      await deleteItem(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-800">📦 Gestion des Stocks & Dons</h1>
            <nav className="flex gap-2 text-sm">
              <Link to="/" className="text-slate-600 hover:text-slate-800">
                Tableau de bord
              </Link>
              <span className="text-slate-300">|</span>
              <Link to="/alerts" className="text-slate-600 hover:text-slate-800">
                Alertes
              </Link>
              <span className="text-slate-300">|</span>
              <Link to="/map" className="text-slate-600 hover:text-slate-800">
                Carte
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <p className="text-slate-600">
            Suivi des ressources disponibles et alertes en cas de pénurie.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            ➕ Nouvel article
          </button>
        </div>

        <AddItemModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setLoading(true); loadItems(); setLoading(false); }}
        />

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            <p className="mb-4">Aucun article en stock.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-blue-600 hover:underline font-medium"
            >
              ➕ Ajouter un premier article
            </button>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onDelete={handleDelete}
                loadingId={loadingId}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Inventory;
