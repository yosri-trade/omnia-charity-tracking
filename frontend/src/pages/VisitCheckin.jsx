import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { validateVisit, getVisitById } from '../services/visit.service.js';
import { calculateDistance } from '../utils/geo.js';
import { compressImageForUpload } from '../utils/imageCompression.js';
import AppNavbar from '../components/AppNavbar.jsx';

const ALLOWED_RADIUS_METERS = 100;
const STEP = {
  LOADING_VISIT: 'loading_visit',
  GETTING_POSITION: 'getting_position',
  POSITION_FOUND: 'position_found',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  ERROR: 'error',
};

function VisitCheckin() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(STEP.LOADING_VISIT);
  const [error, setError] = useState(null);
  const [visit, setVisit] = useState(null);
  const [position, setPosition] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [proofPhoto, setProofPhoto] = useState('');
  const [proofPhotoFile, setProofPhotoFile] = useState(null);

  const loadVisit = useCallback(async () => {
    if (!id) {
      setError(t('checkin.missingId'));
      setStep(STEP.ERROR);
      return;
    }
    setStep(STEP.LOADING_VISIT);
    setError(null);
    try {
      const res = await getVisitById(id);
      setVisit(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || t('checkin.loadError');
      setError(msg);
      setStep(STEP.ERROR);
    }
  }, [id, t]);

  useEffect(() => {
    loadVisit();
  }, [loadVisit]);

  useEffect(() => {
    if (step !== STEP.LOADING_VISIT || !visit) return;

    if (!navigator.geolocation) {
      setError(t('checkin.geoNotSupported'));
      setStep(STEP.ERROR);
      return;
    }

    setStep(STEP.GETTING_POSITION);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        console.log('[VisitCheckin] Position trouvée.', coords);
        setPosition(coords);

        const family = visit?.family;
        const targetLat = family?.coordinates?.lat;
        const targetLng = family?.coordinates?.lng;
        if (typeof targetLat === 'number' && typeof targetLng === 'number') {
          const dist = Math.round(calculateDistance(targetLat, targetLng, coords.lat, coords.lng));
          setDistanceMeters(dist);
          console.log('[VisitCheckin] Distance calculée:', dist, 'm');
        } else {
          setDistanceMeters(null);
          console.log('[VisitCheckin] Famille non géolocalisée, pas de calcul de distance.');
        }

        setStep(STEP.POSITION_FOUND);
      },
      (err) => {
        const msg =
          err.code === 1
            ? t('checkin.allowGeo')
            : err.code === 2
              ? t('checkin.positionUnavailable')
              : t('checkin.positionTimeout');
        setError(msg);
        setStep(STEP.ERROR);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [step, visit, t]);

  const handleProofPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImageForUpload(file);
      setProofPhoto(compressed);
      setProofPhotoFile(file.name);
    } catch (err) {
      setError(err.message || t('checkin.photoError'));
    }
  };

  const handleValidate = async () => {
    if (!position || !id) return;
    if (!canValidate) return;
    console.log('[VisitCheckin] Validation en cours…');
    setStep(STEP.SUBMITTING);
    setError(null);
    try {
      await validateVisit(id, {
        resolveUrgency: false,
        location: { lat: position.lat, lng: position.lng, accuracy: position.accuracy },
        proofPhoto: proofPhoto || undefined,
      });
      console.log('[VisitCheckin] Visite validée.');
      setStep(STEP.SUCCESS);
      setTimeout(() => navigate('/my-missions', { replace: true }), 2500);
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      const msg = serverMsg || err.message || t('checkin.validateError');
      setError(msg);
      setStep(STEP.POSITION_FOUND);
    }
  };

  const family = visit?.family;
  const targetLat = family?.coordinates?.lat;
  const targetLng = family?.coordinates?.lng;
  const hasTargetCoords = typeof targetLat === 'number' && typeof targetLng === 'number';
  const distance = distanceMeters != null ? distanceMeters : null;
  const withinRadius = distance != null && distance <= ALLOWED_RADIUS_METERS;
  const canValidate = hasTargetCoords && withinRadius;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <AppNavbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-sm p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">{t('checkin.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {t('checkin.subtitle')}
        </p>

        {step === STEP.LOADING_VISIT && (
          <p className="text-slate-600 dark:text-slate-400 text-sm" role="status">
            {t('checkin.loadingVisit')}
          </p>
        )}

        {step === STEP.GETTING_POSITION && (
          <>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4" role="status">
              {t('checkin.gettingPosition')}
            </p>
            <button
              type="button"
              disabled
              className="w-full py-3 px-4 font-medium text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-600 rounded-lg cursor-not-allowed"
            >
              {t('checkin.gpsSearch')}
            </button>
          </>
        )}

        {step === STEP.ERROR && error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {step === STEP.POSITION_FOUND && position && (
          <>
            <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-mono space-y-2 text-slate-700 dark:text-slate-300">
              <p>
                <span className="text-slate-500 dark:text-slate-400">📍 {t('checkin.targetLabel')}</span>{' '}
                {hasTargetCoords
                  ? `[${targetLat.toFixed(5)}, ${targetLng.toFixed(5)}]`
                  : t('checkin.notLocated')}
              </p>
              <p>
                <span className="text-slate-500 dark:text-slate-400">🚶 {t('checkin.meLabel')}</span>{' '}
                [{position.lat.toFixed(5)}, {position.lng.toFixed(5)}]
              </p>
              {distanceMeters != null && (
                <p>
                  <span className="text-slate-500 dark:text-slate-400">📏 {t('checkin.distanceLabel')}</span> {distanceMeters} m
                </p>
              )}
              <p>
                <span className="text-slate-500 dark:text-slate-400">🔒 {t('checkin.radiusLabel')}</span> {ALLOWED_RADIUS_METERS} m
              </p>
            </div>

            {hasTargetCoords && distance != null && distance > ALLOWED_RADIUS_METERS && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                ⛔ {t('checkin.tooFar', { distance, radius: ALLOWED_RADIUS_METERS })}
              </div>
            )}

            {hasTargetCoords && withinRadius && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 text-sm">
                ✅ {t('checkin.positionValidated', { distance })}
              </div>
            )}

            {hasTargetCoords && distance == null && (
              <p className="mb-4 text-slate-600 dark:text-slate-400 text-sm">
                {t('checkin.calculatingDistance')}
              </p>
            )}

            {!hasTargetCoords && (
              <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
                {t('checkin.familyNotLocated')}
              </div>
            )}

            <div className="mb-4 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                {t('checkin.proofPhotoLabel')}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                {t('checkin.proofPhotoHint')}
              </p>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 text-sm font-medium cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <span>📷</span>
                  <span>{proofPhoto ? t('checkin.changePhoto') : t('checkin.choosePhoto')}</span>
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
                      className="h-16 w-16 object-cover rounded border border-slate-200 dark:border-slate-600"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">{proofPhotoFile}</span>
                    <button
                      type="button"
                      onClick={() => { setProofPhoto(''); setProofPhotoFile(null); }}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 text-sm font-medium text-red-700 dark:text-red-400 hover:underline focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 rounded"
                      aria-label={t('checkin.removePhoto')}
                    >
                      {t('checkin.removePhoto')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleValidate}
              disabled={!canValidate}
              className={`w-full min-h-[44px] py-3 px-4 font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
                canValidate
                  ? 'text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600'
                  : 'text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 cursor-not-allowed'
              }`}
              aria-disabled={!canValidate}
            >
              {t('checkin.validatePresence')}
            </button>
          </>
        )}

        {step === STEP.SUBMITTING && (
          <p className="text-slate-600 dark:text-slate-400 text-sm" role="status">
            {t('checkin.submitting')}
          </p>
        )}

        {step === STEP.SUCCESS && (
          <p className="text-green-700 dark:text-green-400 font-medium" role="status">
            {t('checkin.success')}
          </p>
        )}

        <Link
          to="/my-missions"
          className="mt-6 block text-center min-h-[44px] flex items-center justify-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 rounded"
        >
          {t('checkin.backToMissions')}
        </Link>
      </div>
      </div>
    </div>
  );
}

export default VisitCheckin;
