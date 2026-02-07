import { useState, useEffect } from 'react';
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
  { id: 'Alimentaire', label: 'Alimentaire' },
  { id: 'Médical', label: 'Médical' },
  { id: 'Vêtements', label: 'Vêtements' },
];

const emptyClothingRow = () => ({ type: 'Adulte', gender: 'M', age: '', size: '' });

function AddFamilyModal({ isOpen, onClose, onSuccess, initialData }) {
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
      setError('Le nom est requis.');
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
      setError(err.response?.data?.error || err.message || "Erreur lors de l'enregistrement.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-800">
            {isEdit ? 'Modifier la famille' : 'Ajouter une famille'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nom de la famille"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
              Adresse
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={handleAddressChange}
              disabled={addressLoading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:cursor-wait"
              placeholder={addressLoading ? 'Recherche de l\'adresse...' : 'Adresse complète'}
            />
            {addressFromGeocode && !addressLoading && (
              <p className="mt-1 text-xs text-green-600">📍 Adresse trouvée !</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
              Téléphone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+216 12 345 678"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
              Statut
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>
          <div>
            <label htmlFor="membersCount" className="block text-sm font-medium text-slate-700 mb-1">
              Nombre de membres
            </label>
            <input
              id="membersCount"
              type="number"
              min={1}
              value={membersCount}
              onChange={(e) => setMembersCount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="familyHistory" className="block text-sm font-medium text-slate-700 mb-1">
              Histoire / Contexte de la famille
            </label>
            <textarea
              id="familyHistory"
              value={familyHistory}
              onChange={(e) => setFamilyHistory(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Ex: Père accidenté, logement insalubre..."
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">
              Localisation GPS
            </span>
            <div
              className="rounded-lg overflow-hidden border border-slate-300"
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
            <p className="mt-1 text-xs text-slate-500">
              {coordinates.lat != null && coordinates.lng != null
                ? `Coordonnées sélectionnées : ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
                : 'Aucune'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Cliquez sur la carte pour placer le marqueur.
            </p>
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">Besoins</span>
            <div className="space-y-2">
              {NEEDS_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 cursor-pointer text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={needs.includes(opt.id)}
                    onChange={() => toggleNeed(opt.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {hasMedical && (
              <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom du médicament ou traitement
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={medicationInput}
                    onChange={(e) => setMedicationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Ex: Paracétamol, Insuline (séparez par des virgules)"
                  />
                  <button
                    type="button"
                    onClick={addMedication}
                    className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    +
                  </button>
                </div>
                {medications.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {medications.map((med, i) => (
                      <li
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-sm"
                      >
                        {med}
                        <button
                          type="button"
                          onClick={() => removeMedication(i)}
                          className="text-red-600 hover:text-red-800"
                          aria-label="Supprimer"
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
              <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">Détails vêtements</span>
                  <button
                    type="button"
                    onClick={addClothingRow}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    ➕ Ajouter un membre
                  </button>
                </div>
                <div className="space-y-2">
                  {clothing.map((row, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center gap-2 p-2 rounded border border-slate-200 bg-white"
                    >
                      <select
                        value={row.type}
                        onChange={(e) => updateClothingRow(index, 'type', e.target.value)}
                        className="px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Enfant">Enfant</option>
                        <option value="Adulte">Adulte</option>
                      </select>
                      <select
                        value={row.gender}
                        onChange={(e) => updateClothingRow(index, 'gender', e.target.value)}
                        className="px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="M">Homme</option>
                        <option value="F">Femme</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        placeholder="Âge"
                        value={row.age}
                        onChange={(e) => updateClothingRow(index, 'age', e.target.value)}
                        className="w-16 px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Taille (opt.)"
                        value={row.size}
                        onChange={(e) => updateClothingRow(index, 'size', e.target.value)}
                        className="w-20 px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeClothingRow(index)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        aria-label="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (isEdit ? 'Mise à jour...' : 'Enregistrement...') : (isEdit ? 'Mettre à jour' : 'Enregistrer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFamilyModal;
