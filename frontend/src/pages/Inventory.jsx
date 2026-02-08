import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import AppNavbar from '../components/AppNavbar.jsx';
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
  { value: 'Alimentaire', labelKey: 'inventory.catAlimentaire' },
  { value: 'Médical', labelKey: 'inventory.catMedical' },
  { value: 'Vêtements', labelKey: 'inventory.catVetements' },
  { value: 'Hygiène', labelKey: 'inventory.catHygiene' },
  { value: 'Scolaire', labelKey: 'inventory.catScolaire' },
  { value: 'Autre', labelKey: 'inventory.catAutre' },
];

function ItemCard({ item, onAdd, onRemove, onDelete, loadingId }) {
  const { t } = useTranslation();
  const qty = item.quantity ?? 0;
  const threshold = item.minThreshold ?? 10;
  const isLow = qty < threshold;
  const maxForBar = Math.max(threshold, qty, 1);
  const percent = Math.min(100, (qty / maxForBar) * 100);

  const icon = CATEGORY_ICONS[item.category] || '📦';

  return (
    <div
      className={`rounded-xl border-2 p-5 shadow-sm transition-shadow hover:shadow-md ${
        isLow ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl shrink-0" aria-hidden>
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{item.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{item.category} · {item.unit}</p>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
            isLow ? 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-200' : 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200'
          }`}
        >
          {isLow ? `⚠️ ${t('inventory.shortage')}` : t('inventory.inStock')}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600 dark:text-slate-400">
            {qty} {item.unit}
          </span>
          <span className="text-slate-600 dark:text-slate-400">{t('inventory.threshold')}: {threshold}</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
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
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800/50 flex items-center justify-center text-lg font-bold disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
            aria-label={t('inventory.addStock')}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => onRemove(item._id)}
            disabled={loadingId === item._id || qty <= 0}
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-500 flex items-center justify-center text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
            aria-label={t('inventory.removeStock')}
          >
            −
          </button>
        </div>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="min-h-[44px] inline-flex items-center px-3 text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 rounded"
          aria-label={t('inventory.deleteItem')}
        >
          {t('inventory.delete')}
        </button>
      </div>
    </div>
  );
}

function AddItemModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation();
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
      setError(t('inventory.nameRequired'));
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
      setError(err.response?.data?.error || err.message || t('inventory.addError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center safe-area-modal">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-sm max-h-[90vh] flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-inventory"
      >
        {/* Header fixe */}
        <div className="shrink-0 border-b border-slate-200 dark:border-slate-600 px-6 py-4 bg-white dark:bg-slate-800 rounded-t-xl z-10">
          <h2 id="modal-title-inventory" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t('inventory.newItem')}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Body scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 overscroll-contain [&_input]:scroll-mt-2 [&_input]:scroll-mb-2 [&_select]:scroll-mt-2 [&_select]:scroll-mb-2 [&_textarea]:scroll-mt-2 [&_textarea]:scroll-mb-2 [&_button]:scroll-mt-2 [&_button]:scroll-mb-2">
          {error && (
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('family.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={t('inventory.placeholderName')}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('inventory.category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('inventory.quantity')}</label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('inventory.unit')}</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={t('inventory.placeholderUnit')}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('inventory.thresholdLabel')}</label>
            <input
              type="number"
              min={0}
              value={minThreshold}
              onChange={(e) => setMinThreshold(Number(e.target.value) ?? 10)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          </div>
          {/* Footer sticky */}
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-600 px-6 py-4 bg-white dark:bg-slate-800 rounded-b-xl">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500"
            >
              {t('inventory.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? t('inventory.adding') : t('inventory.add')}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Inventory() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { t } = useTranslation();
  const loadItems = useCallback(async () => {
    try {
      setError(null);
      const res = await getAllItems();
      setItems(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('inventory.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleAdd = async (id) => {
    setLoadingId(id);
    try {
      const res = await updateStock(id, 1);
      setItems((prev) => prev.map((i) => (i._id === id ? res.data : i)));
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('common.error'));
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
      setError(err.response?.data?.error || err.message || t('common.error'));
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(t('inventory.deleteConfirm', { name: item.name }))) return;
    try {
      await deleteItem(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('common.error'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppNavbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <p className="text-slate-600 dark:text-slate-400">
            {t('inventory.subtitle')}
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center min-h-[44px] gap-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            aria-label={t('inventory.newItem')}
          >
            <span aria-hidden>➕</span> {t('inventory.newItem')}
          </button>
        </div>

        <AddItemModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setLoading(true); loadItems(); setLoading(false); }}
        />

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-12 text-center text-slate-600 dark:text-slate-400">
            <p className="mb-4">{t('inventory.noItems')}</p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 py-3 text-blue-600 dark:text-blue-400 hover:underline font-medium focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded"
              aria-label={t('inventory.addFirst')}
            >
              ➕ {t('inventory.addFirst')}
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
