import { useState, useEffect } from 'react';
import { createVisit } from '../../services/visit.service.js';
import { getVolunteers } from '../../services/user.service.js';
import { calculateDistance } from '../../utils/geo.js';
import { compressImageForUpload } from '../../utils/imageCompression.js';

const TYPE_OPTIONS = [
  { id: 'Alimentaire', label: 'Alimentaire' },
  { id: 'Médical', label: 'Médical' },
  { id: 'Social', label: 'Social' },
  { id: 'Autre', label: 'Autre' },
];

const STATUS_OPTIONS = [
  { id: 'COMPLETED', label: 'Visite Réalisée' },
  { id: 'PLANNED', label: 'Visite Planifiée' },
];

function toDatetimeLocal(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MAX_DISTANCE_METERS = 500;

function AddVisitModal({ isOpen, onClose, familyId, familyStatus, familyCoordinates, onSuccess }) {
  const [dateTime, setDateTime] = useState(() => toDatetimeLocal(new Date()));
  const [status, setStatus] = useState('COMPLETED');
  const [types, setTypes] = useState([]);
  const [notes, setNotes] = useState('');
  const [resolveUrgency, setResolveUrgency] = useState(false);
  const [assignedToIds, setAssignedToIds] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [proofPhoto, setProofPhoto] = useState('');
  const [proofPhotoFileName, setProofPhotoFileName] = useState('');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setDateTime(toDatetimeLocal(now));
      setStatus('COMPLETED');
      setResolveUrgency(false);
      setAssignedToIds([]);
      setProofPhoto('');
      setProofPhotoFileName('');
    }
  }, [isOpen, familyStatus]);

  useEffect(() => {
    if (isOpen) {
      getVolunteers()
        .then((res) => setVolunteers(res.data || []))
        .catch(() => setVolunteers([]));
    }
  }, [isOpen]);

  const handleDateTimeChange = (e) => {
    const val = e.target.value;
    setDateTime(val);
    if (val) {
      const selectedDate = new Date(val);
      if (selectedDate > new Date()) {
        setStatus('PLANNED');
      }
    }
  };

  const toggleType = (typeId) => {
    setTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const toggleAssigned = (userId) => {
    setAssignedToIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleProofPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImageForUpload(file);
      setProofPhoto(compressed);
      setProofPhotoFileName(file.name);
    } catch (err) {
      setError(err.message || 'Impossible de traiter la photo.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (status === 'PLANNED') {
      setSubmitting(true);
      try {
        const payload = {
          familyId,
          date: dateTime ? new Date(dateTime).toISOString() : undefined,
          status,
          types,
          notes: notes.trim() || undefined,
          resolveUrgency: familyStatus === 'URGENT' ? resolveUrgency : false,
          assignedTo: assignedToIds.length ? assignedToIds : undefined,
        };
        await createVisit(payload);
        onSuccess?.();
        handleClose();
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Erreur lors de l'enregistrement.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (status === 'COMPLETED') {
      if (!navigator.geolocation) {
        setError('Votre navigateur ne supporte pas la géolocalisation. Impossible d\'enregistrer une visite réalisée.');
        return;
      }
      setIsCheckingLocation(true);
      setError('');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          const familyLat = familyCoordinates?.lat;
          const familyLng = familyCoordinates?.lng;
          const familyHasCoords =
            typeof familyLat === 'number' && typeof familyLng === 'number';

          if (!familyHasCoords) {
            window.alert(
              'Attention : Cette famille n\'est pas géolocalisée, validation acceptée exceptionnellement.'
            );
          } else {
            const distanceM = Math.round(calculateDistance(lat, lng, familyLat, familyLng));
            if (distanceM > MAX_DISTANCE_METERS) {
              setError(`⛔ Trop loin : ${distanceM} mètres. Rapprochez-vous du domicile pour enregistrer une visite réalisée.`);
              setIsCheckingLocation(false);
              return;
            }
          }

          const checkInLocation = {
            lat,
            lng,
            accuracy,
            recordedAt: new Date().toISOString(),
          };
          setSubmitting(true);
          try {
            const payload = {
              familyId,
              date: dateTime ? new Date(dateTime).toISOString() : undefined,
              status,
              types,
              notes: notes.trim() || undefined,
              resolveUrgency: familyStatus === 'URGENT' ? resolveUrgency : false,
              checkInLocation,
              proofPhoto: proofPhoto || undefined,
            };
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/086136c2-e26c-4d80-bbd3-7e6f62415c89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AddVisitModal.jsx:submit COMPLETED',message:'Payload before createVisit',data:{payloadKeys:Object.keys(payload),hasProofPhoto:!!payload.proofPhoto},timestamp:Date.now(),hypothesisId:'H2',runId:'post-fix'})}).catch(()=>{});
            // #endregion
            await createVisit(payload);
            onSuccess?.();
            handleClose();
          } catch (err) {
            setError(err.response?.data?.error || err.message || "Erreur lors de l'enregistrement.");
          } finally {
            setSubmitting(false);
            setIsCheckingLocation(false);
          }
        },
        () => {
          setError('Impossible de valider sans GPS. Veuillez autoriser la localisation pour enregistrer une visite réalisée.');
          setIsCheckingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  const handleClose = () => {
    setTypes([]);
    setNotes('');
    setResolveUrgency(false);
    setAssignedToIds([]);
    setProofPhoto('');
    setProofPhotoFileName('');
    setError('');
    onClose?.();
  };

  if (!isOpen) return null;

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/086136c2-e26c-4d80-bbd3-7e6f62415c89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AddVisitModal.jsx:render',message:'Modal form rendered',data:{status,isOpen,hasProofPhotoInForm:status==='COMPLETED'},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="visit-modal-title"
      >
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 id="visit-modal-title" className="text-lg font-semibold text-slate-800">
            Nouvelle visite
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="visit-datetime" className="block text-sm font-medium text-slate-700 mb-1">
              Date et Heure
            </label>
            <input
              id="visit-datetime"
              type="datetime-local"
              value={dateTime}
              onChange={handleDateTimeChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="visit-status" className="block text-sm font-medium text-slate-700 mb-1">
              Statut
            </label>
            <select
              id="visit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {status === 'PLANNED' && (
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-1">
                Assigner à (optionnel)
              </span>
              <p className="text-xs text-slate-500 mb-2">
                Laisser vide pour rendre la mission visible à tous les bénévoles.
              </p>
              <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1.5">
                {volunteers.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun bénévole</p>
                ) : (
                  volunteers.map((u) => (
                    <label
                      key={u._id}
                      className="flex items-center gap-2 cursor-pointer text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={assignedToIds.includes(u._id)}
                        onChange={() => toggleAssigned(u._id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {u.name}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">Type d'aide</span>
            <div className="space-y-2">
              {TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 cursor-pointer text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={types.includes(opt.id)}
                    onChange={() => toggleType(opt.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Compte-rendu de la visite..."
            />
          </div>

          {status === 'COMPLETED' && (
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Photo preuve (recommandé)
              </p>
              <p className="text-xs text-blue-700 mb-2">
                Justifiez la visite réalisée par une photo (livraison, lieu, famille, etc.).
              </p>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-blue-300 bg-white text-blue-700 text-sm font-medium cursor-pointer hover:bg-blue-50">
                  <span>📷</span>
                  <span>{proofPhoto ? 'Changer la photo' : 'Choisir une photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={handleProofPhotoChange}
                  />
                </label>
                {proofPhoto && (
                  <div className="flex items-center gap-2">
                    <img
                      src={proofPhoto}
                      alt="Aperçu"
                      className="h-16 w-16 object-cover rounded border border-slate-200"
                    />
                    <span className="text-xs text-slate-600 truncate flex-1">{proofPhotoFileName}</span>
                    <button
                      type="button"
                      onClick={() => { setProofPhoto(''); setProofPhotoFileName(''); }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {familyStatus === 'URGENT' && (
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <input
                type="checkbox"
                checked={resolveUrgency}
                onChange={(e) => setResolveUrgency(e.target.checked)}
                className="rounded border-amber-400 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-amber-900">
                ✅ Clore le dossier URGENT (Passer en ACTIVE)
              </span>
            </label>
          )}

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
              disabled={submitting || isCheckingLocation}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingLocation
                ? '📍 Localisation en cours...'
                : submitting
                  ? 'Enregistrement...'
                  : status === 'COMPLETED'
                    ? '📍 Valider position & Enregistrer'
                    : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddVisitModal;
