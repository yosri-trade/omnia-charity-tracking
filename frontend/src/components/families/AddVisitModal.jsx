import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createVisit } from '../../services/visit.service.js';
import { getVolunteers } from '../../services/user.service.js';
import { calculateDistance } from '../../utils/geo.js';
import { compressImageForUpload } from '../../utils/imageCompression.js';

const SpeechRecognitionAPI = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
const LANG_MAP = { fr: 'fr-FR', ar: 'ar-SA', en: 'en-US' };

const TYPE_OPTIONS = [
  { id: 'Alimentaire', labelKey: 'types.alimentaire' },
  { id: 'Médical', labelKey: 'types.medical' },
  { id: 'Social', labelKey: 'types.social' },
  { id: 'Autre', labelKey: 'types.autre' },
];

function toDatetimeLocal(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MAX_DISTANCE_METERS = 500;

function AddVisitModal({ isOpen, onClose, familyId, familyStatus, familyCoordinates, onSuccess }) {
  const { t, i18n } = useTranslation();
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
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const recognitionRef = useRef(null);

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

  const toggleVoiceRecording = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError(t('visit.notesVoiceUnsupported'));
      return;
    }
    if (isVoiceRecording) {
      recognitionRef.current?.stop();
      setIsVoiceRecording(false);
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANG_MAP[i18n.language] || 'fr-FR';
    recognition.onresult = (e) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          transcript += e.results[i][0].transcript;
        }
      }
      if (transcript.trim()) {
        setNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    recognition.onend = () => setIsVoiceRecording(false);
    recognition.onerror = () => setIsVoiceRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsVoiceRecording(true);
  }, [isVoiceRecording, i18n.language, t]);

  useEffect(() => {
    if (!isOpen && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsVoiceRecording(false);
    }
  }, [isOpen]);

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

  const statusOptions = [
    { id: 'COMPLETED', labelKey: 'visit.statusCompleted' },
    { id: 'PLANNED', labelKey: 'visit.statusPlanned' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center safe-area-modal">
      <div
        className="absolute inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600"
        role="dialog"
        aria-modal="true"
        aria-labelledby="visit-modal-title"
      >
        {/* Header fixe */}
        <div className="shrink-0 border-b border-slate-200 dark:border-slate-600 px-6 py-4 bg-white dark:bg-slate-800 rounded-t-xl">
          <h2 id="visit-modal-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t('visit.newVisit')}
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
            <label htmlFor="visit-datetime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('visit.dateTime')}
            </label>
            <input
              id="visit-datetime"
              type="datetime-local"
              value={dateTime}
              onChange={handleDateTimeChange}
              className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0"
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="visit-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('visit.status')}
            </label>
            <select
              id="visit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0"
              aria-required="true"
            >
              {statusOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {status === 'PLANNED' && (
            <div role="group" aria-labelledby="visit-assign-label">
              <span id="visit-assign-label" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('visit.assignTo')}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                {t('visit.assignToHint')}
              </p>
              <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg p-2 space-y-1.5">
                {volunteers.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">{t('visit.noVolunteers')}</p>
                ) : (
                  volunteers.map((u) => (
                    <label
                      key={u._id}
                      className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 min-h-[44px] py-1"
                    >
                      <input
                        type="checkbox"
                        checked={assignedToIds.includes(u._id)}
                        onChange={() => toggleAssigned(u._id)}
                        className="min-h-[22px] min-w-[22px] rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0"
                        aria-label={`Assigner à ${u.name}`}
                      />
                      {u.name}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div role="group" aria-labelledby="visit-type-label">
            <span id="visit-type-label" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('visit.typeOfHelp')}</span>
            <div className="space-y-2">
              {TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 min-h-[44px] py-2"
                >
                  <input
                    type="checkbox"
                    checked={types.includes(opt.id)}
                    onChange={() => toggleType(opt.id)}
                    className="min-h-[22px] min-w-[22px] rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0"
                    aria-label={`${t('visit.typeOfHelp')}: ${t(opt.labelKey)}`}
                  />
                  {t(opt.labelKey)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('visit.notes')}
            </label>
            <p id="notes-desc" className="sr-only">{t('visit.notesDesc')}</p>
            <div className="relative">
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full min-h-[88px] px-3 py-3 pr-12 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 resize-none"
                placeholder="Compte-rendu de la visite..."
                aria-describedby="notes-desc notes-voice-hint"
              />
              <button
                type="button"
                onClick={toggleVoiceRecording}
                disabled={!SpeechRecognitionAPI}
                title={t('visit.notesVoiceHint')}
                aria-label={t('visit.notesVoiceHint')}
                className={`absolute top-2 end-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
                  isVoiceRecording
                    ? 'bg-red-500 dark:bg-red-600 text-white animate-pulse'
                    : SpeechRecognitionAPI
                      ? 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <span aria-hidden>🎤</span>
              </button>
            </div>
            <p id="notes-voice-hint" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('visit.notesVoiceHint')}
            </p>
          </div>

          {status === 'COMPLETED' && (
            <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                {t('visit.proofPhoto')}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                {t('visit.proofPhotoHint')}
              </p>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 text-blue-800 dark:text-blue-200 text-sm font-medium cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2">
                  <span aria-hidden>📷</span>
                  <span>{proofPhoto ? t('visit.changePhoto') : t('visit.choosePhoto')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={handleProofPhotoChange}
                    aria-label="Choisir une photo preuve"
                  />
                </label>
                {proofPhoto && (
                  <div className="flex items-center gap-2">
                    <img
                      src={proofPhoto}
                      alt="Aperçu de la photo preuve"
                      className="h-16 w-16 object-cover rounded border border-slate-200"
                    />
                    <span className="text-xs text-slate-600 truncate flex-1">{proofPhotoFileName}</span>
                    <button
                      type="button"
                      onClick={() => { setProofPhoto(''); setProofPhotoFileName(''); }}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 text-sm font-medium text-red-700 dark:text-red-400 hover:underline focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded"
                      aria-label={t('visit.removePhoto')}
                    >
                      {t('visit.removePhoto')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {familyStatus === 'URGENT' && (
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px] p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg scroll-mt-2 scroll-mb-2">
              <input
                type="checkbox"
                checked={resolveUrgency}
                onChange={(e) => setResolveUrgency(e.target.checked)}
                className="min-h-[22px] min-w-[22px] rounded border-amber-400 text-green-600 focus:ring-2 focus:ring-green-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0"
                aria-label={t('visit.resolveUrgent')}
              />
              <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
                ✅ {t('visit.resolveUrgent')}
              </span>
            </label>
          )}
          </div>
          {/* Footer sticky */}
          <div className="shrink-0 sticky bottom-0 border-t border-slate-200 dark:border-slate-600 px-6 py-4 bg-white dark:bg-slate-800 rounded-b-xl">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 min-h-[44px] px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {t('visit.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || isCheckingLocation}
              className="flex-1 min-h-[44px] px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isCheckingLocation
                ? `📍 ${t('visit.locating')}`
                : submitting
                  ? t('visit.saving')
                  : status === 'COMPLETED'
                    ? `📍 ${t('visit.validateAndSave')}`
                    : t('visit.save')}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddVisitModal;
