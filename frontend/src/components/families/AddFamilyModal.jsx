import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import { createFamily, updateFamily } from '../../services/family.service.js';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import UserLocationMarker from '../maps/UserLocationMarker.jsx';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TUNISIA_CENTER = [34.0, 9.0];
const MAP_ZOOM = 6;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

async function fetchReverseGeocode(lat, lng) {
  const url = `${NOMINATIM_URL}?format=json&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OMNIA-Charity-Tracking/1.0' },
  });
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  return data.display_name || '';
}

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

const NEEDS_OPTIONS = [
  { id: 'Alimentaire', labelKey: 'types.alimentaire' },
  { id: 'Médical', labelKey: 'types.medical' },
  { id: 'Vêtements', labelKey: 'types.vetements' },
];

const emptyClothingRow = () => ({ type: 'Adulte', gender: 'M', age: '', size: '' });

function AddFamilyModal({ isOpen, onClose, onSuccess, initialData }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [membersCount, setMembersCount] = useState(1);
  const [familyHistory, setFamilyHistory] = useState('');
  const [needs, setNeeds] = useState([]);
  const [medications, setMedications] = useState([]);
  const [medicationInput, setMedicationInput] = useState('');
  const [clothing, setClothing] = useState([]);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressFromGeocode, setAddressFromGeocode] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(initialData?._id);
  const hasMedical = needs.includes('Médical');
  const hasClothing = needs.includes('Vêtements');

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setName(initialData.name || '');
      setAddress(initialData.address || '');
      setPhone(initialData.phone || '');
      setStatus(initialData.status || 'ACTIVE');
      setMembersCount(initialData.membersCount ?? 1);
      setFamilyHistory(initialData.familyHistory || '');
      setNeeds(Array.isArray(initialData.needs) ? [...initialData.needs] : []);
      const nd = initialData.needsDetails || {};
      setMedications(Array.isArray(nd.medications) ? [...nd.medications] : []);
      setMedicationInput('');
      setClothing(
        Array.isArray(nd.clothing) && nd.clothing.length > 0
          ? nd.clothing.map((c) => ({
              type: c.type || 'Adulte',
              gender: c.gender || 'M',
              age: c.age ?? '',
              size: c.size || '',
            }))
          : []
      );
      setCoordinates({
        lat: initialData.coordinates?.lat ?? null,
        lng: initialData.coordinates?.lng ?? null,
      });
    } else {
      setName('');
      setAddress('');
      setPhone('');
      setStatus('ACTIVE');
      setMembersCount(1);
      setFamilyHistory('');
      setNeeds([]);
      setMedications([]);
      setMedicationInput('');
      setClothing([]);
      setCoordinates({ lat: null, lng: null });
    }
    setAddressFromGeocode(false);
    setError('');
  }, [isOpen, initialData]);

  const handleLocationSelect = async ({ lat, lng }) => {
    setCoordinates({ lat, lng });
    setAddressLoading(true);
    setAddressFromGeocode(false);
    try {
      const displayName = await fetchReverseGeocode(lat, lng);
      if (displayName) {
        setAddress(displayName);
        setAddressFromGeocode(true);
      }
    } catch {
      // Garde les coordonnées, laisse l'adresse vide
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    setAddressFromGeocode(false);
  };

  const toggleNeed = (needId) => {
    setNeeds((prev) =>
      prev.includes(needId) ? prev.filter((n) => n !== needId) : [...prev, needId]
    );
  };

  const addMedication = () => {
    const val = medicationInput.trim();
    if (!val) return;
    const parts = val.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      setMedications((prev) => [...prev, ...parts]);
      setMedicationInput('');
    }
  };

  const removeMedication = (index) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const addClothingRow = () => {
    setClothing((prev) => [...prev, emptyClothingRow()]);
  };

  const updateClothingRow = (index, field, value) => {
    setClothing((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeClothingRow = (index) => {
    setClothing((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError(t('family.nameRequired'));
      return;
    }
    setSubmitting(true);
    const needsDetailsPayload = {};
    if (hasMedical) {
      const meds = medicationInput.trim()
        ? [...medications, ...medicationInput.split(',').map((s) => s.trim()).filter(Boolean)]
        : medications;
      needsDetailsPayload.medications = meds;
    }
    if (hasClothing) {
      needsDetailsPayload.clothing = clothing
        .filter((c) => c.type && c.gender)
        .map((c) => ({
          type: c.type,
          gender: c.gender,
          age: c.age === '' ? undefined : Number(c.age),
          size: c.size?.trim() || undefined,
        }));
    }

    const payload = {
      name: name.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      status,
      membersCount: Math.max(1, Number(membersCount) || 1),
      familyHistory: familyHistory.trim() || undefined,
      needs,
      needsDetails: Object.keys(needsDetailsPayload).length > 0 ? needsDetailsPayload : undefined,
      coordinates: { lat: coordinates.lat, lng: coordinates.lng },
    };
    try {
      if (isEdit) {
        await updateFamily(initialData._id, payload);
      } else {
        await createFamily(payload);
      }
      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('family.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setAddress('');
    setPhone('');
    setStatus('ACTIVE');
    setMembersCount(1);
    setFamilyHistory('');
    setNeeds([]);
    setMedications([]);
    setMedicationInput('');
    setClothing([]);
    setCoordinates({ lat: null, lng: null });
    setAddressLoading(false);
    setAddressFromGeocode(false);
    setError('');
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center safe-area-modal">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header fixe */}
        <div className="shrink-0 border-b border-slate-200 dark:border-slate-600 px-6 py-4 bg-white dark:bg-slate-800 rounded-t-xl z-10">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {isEdit ? t('family.editFamily') : t('family.addFamily')}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 flex overflow-hidden">
          {/* Body scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 overscroll-contain [&_input]:scroll-mt-2 [&_input]:scroll-mb-2 [&_select]:scroll-mt-2 [&_select]:scroll-mb-2 [&_textarea]:scroll-mt-2 [&_textarea]:scroll-mb-2 [&_button]:scroll-mt-2 [&_button]:scroll-mb-2">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('family.name')} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-slate-800"
              placeholder={t('family.namePlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('family.address')}
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={handleAddressChange}
              disabled={addressLoading}
              className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-600 disabled:cursor-wait"
              placeholder={addressLoading ? t('family.addressSearch') : t('family.addressPlaceholder')}
            />
            {addressFromGeocode && !addressLoading && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">📍 {t('family.addressFound')}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('family.phone')}
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-slate-800"
              placeholder="+216 12 345 678"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('family.status')}
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-slate-800"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>
          <div>
            <label htmlFor="membersCount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('family.membersCount')}
            </label>
            <input
              id="membersCount"
              type="number"
              min={1}
              value={membersCount}
              onChange={(e) => setMembersCount(e.target.value)}
              className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-slate-800"
            />
          </div>
          <div>
            <label htmlFor="familyHistory" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('family.history')}
            </label>
            <textarea
              id="familyHistory"
              value={familyHistory}
              onChange={(e) => setFamilyHistory(e.target.value)}
              rows={3}
              className="w-full min-h-[88px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-slate-800 resize-none"
              placeholder="Ex: Père accidenté, logement insalubre..."
            />
          </div>
          <div role="group" aria-labelledby="family-gps-label">
            <span id="family-gps-label" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('family.gps')}
            </span>
            <div
              className="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-500"
              style={{ height: 250 }}
            >
              <MapContainer
                center={coordinates.lat != null ? [coordinates.lat, coordinates.lng] : TUNISIA_CENTER}
                zoom={MAP_ZOOM}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onLocationSelect={handleLocationSelect} />
                <MapInvalidateSize />
                <UserLocationMarker />
                {coordinates.lat != null && coordinates.lng != null && (
                  <Marker position={[coordinates.lat, coordinates.lng]} />
                )}
              </MapContainer>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {coordinates.lat != null && coordinates.lng != null
                ? `${t('family.gpsHint')} : ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
                : t('family.none')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {t('family.gpsClickHint')}
            </p>
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('family.needs')}</span>
            <div className="space-y-2">
              {NEEDS_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={needs.includes(opt.id)}
                    onChange={() => toggleNeed(opt.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {t(opt.labelKey)}
                </label>
              ))}
            </div>

            {hasMedical && (
              <div className="mt-4 p-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('family.medicationLabel')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={medicationInput}
                    onChange={(e) => setMedicationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={t('family.medicationPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={addMedication}
                    className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60"
                  >
                    +
                  </button>
                </div>
                {medications.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {medications.map((med, i) => (
                      <li
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-800 dark:text-slate-200"
                      >
                        {med}
                        <button
                          type="button"
                          onClick={() => removeMedication(i)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          aria-label={t('dashboard.delete')}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {hasClothing && (
              <div className="mt-4 p-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('family.clothingDetails')}</span>
                  <button
                    type="button"
                    onClick={addClothingRow}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60"
                  >
                    ➕ {t('family.addMember')}
                  </button>
                </div>
                <div className="space-y-2">
                  {clothing.map((row, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center gap-2 p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                    >
                      <select
                        value={row.type}
                        onChange={(e) => updateClothingRow(index, 'type', e.target.value)}
                        className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Enfant">{t('family.child')}</option>
                        <option value="Adulte">{t('family.adult')}</option>
                      </select>
                      <select
                        value={row.gender}
                        onChange={(e) => updateClothingRow(index, 'gender', e.target.value)}
                        className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="M">{t('family.man')}</option>
                        <option value="F">{t('family.woman')}</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        placeholder={t('family.age')}
                        value={row.age}
                        onChange={(e) => updateClothingRow(index, 'age', e.target.value)}
                        className="w-16 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder={t('family.sizeOptional')}
                        value={row.size}
                        onChange={(e) => updateClothingRow(index, 'size', e.target.value)}
                        className="w-20 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeClothingRow(index)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        aria-label={t('dashboard.delete')}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
          {/* Footer sticky */}
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-600 px-6 py-4 bg-white dark:bg-slate-800 rounded-b-xl">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 min-h-[44px] px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
              >
                {t('family.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 min-h-[44px] px-4 py-3 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
              >
                {submitting ? (isEdit ? t('family.updating') : t('family.saving')) : (isEdit ? t('family.update') : t('family.save'))}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFamilyModal;
