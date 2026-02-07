import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { validateVisit, getVisitById } from '../services/visit.service.js';
import { calculateDistance } from '../utils/geo.js';
import { compressImageForUpload } from '../utils/imageCompression.js';

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
      setError('Identifiant de visite manquant.');
      setStep(STEP.ERROR);
      return;
    }
    console.log('[VisitCheckin] Chargement de la visite…', id);
    setStep(STEP.LOADING_VISIT);
    setError(null);
    try {
      const res = await getVisitById(id);
      setVisit(res.data);
      console.log('[VisitCheckin] Visite chargée.', res.data?.family?.name);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Impossible de charger la visite.';
      console.error('[VisitCheckin] Erreur chargement visite:', err);
      setError(msg);
      setStep(STEP.ERROR);
    }
  }, [id]);

  useEffect(() => {
    loadVisit();
  }, [loadVisit]);

  useEffect(() => {
    if (step !== STEP.LOADING_VISIT || !visit) return;

    if (!navigator.geolocation) {
      console.error('[VisitCheckin] GPS non supporté.');
      alert('GPS non supporté sur cet appareil.');
      setError('La géolocalisation n\'est pas supportée par ce navigateur.');
      setStep(STEP.ERROR);
      return;
    }

    console.log('[VisitCheckin] Démarrage GPS…');
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
        console.error('[VisitCheckin] Erreur géolocalisation:', err);
        const msg =
          err.code === 1
            ? 'Veuillez autoriser la géolocalisation dans le navigateur.'
            : err.code === 2
              ? 'Position indisponible.'
              : 'Délai dépassé pour obtenir la position.';
        alert(`Erreur : ${msg}`);
        setError(msg);
        setStep(STEP.ERROR);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [step, visit]);

  const handleProofPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImageForUpload(file);
      setProofPhoto(compressed);
      setProofPhotoFile(file.name);
    } catch (err) {
      setError(err.message || 'Impossible de traiter la photo.');
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
      const msg = serverMsg || err.message || 'Échec de la validation.';
      console.error('[VisitCheckin] Erreur API validate:', err.response?.data || err);
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold text-slate-800 mb-2">Check-in de la visite</h1>
        <p className="text-sm text-slate-500 mb-6">
          Validez votre présence sur place en utilisant votre position GPS.
        </p>

        {step === STEP.LOADING_VISIT && (
          <p className="text-slate-600 text-sm" role="status">
            Recherche de la visite…
          </p>
        )}

        {step === STEP.GETTING_POSITION && (
          <>
            <p className="text-slate-600 text-sm mb-4" role="status">
              Recherche de votre position GPS…
            </p>
            <button
              type="button"
              disabled
              className="w-full py-3 px-4 font-medium text-slate-400 bg-slate-200 rounded-lg cursor-not-allowed"
            >
              Recherche GPS…
            </button>
          </>
        )}

        {step === STEP.ERROR && error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === STEP.POSITION_FOUND && position && (
          <>
            <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono space-y-2">
              <p>
                <span className="text-slate-500">📍 Cible :</span>{' '}
                {hasTargetCoords
                  ? `[${targetLat.toFixed(5)}, ${targetLng.toFixed(5)}]`
                  : 'Non géolocalisée'}
              </p>
              <p>
                <span className="text-slate-500">🚶 Moi :</span>{' '}
                [{position.lat.toFixed(5)}, {position.lng.toFixed(5)}]
              </p>
              {distanceMeters != null && (
                <p>
                  <span className="text-slate-500">📏 Distance calculée :</span> {distanceMeters} m
                </p>
              )}
              <p>
                <span className="text-slate-500">🔒 Rayon autorisé :</span> {ALLOWED_RADIUS_METERS} m
              </p>
            </div>

            {hasTargetCoords && distance != null && distance > ALLOWED_RADIUS_METERS && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                ⛔ Vous êtes trop loin ({distance} m). Rapprochez-vous à moins de {ALLOWED_RADIUS_METERS} m.
              </div>
            )}

            {hasTargetCoords && withinRadius && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                ✅ Position validée ({distance} m). Vous pouvez faire le Check-in.
              </div>
            )}

            {hasTargetCoords && distance == null && (
              <p className="mb-4 text-slate-600 text-sm">
                Calcul de la distance en cours…
              </p>
            )}

            {!hasTargetCoords && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                Cette famille n&apos;est pas géolocalisée. Le check-in par distance n&apos;est pas possible.
              </div>
            )}

            <div className="mb-4 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Photo preuve (recommandé)
              </p>
              <p className="text-xs text-blue-700 mb-2">
                Ajoutez une photo sur place pour attester de votre passage (livraison, lieu, etc.).
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
                    <span className="text-xs text-slate-600 truncate flex-1">{proofPhotoFile}</span>
                    <button
                      type="button"
                      onClick={() => { setProofPhoto(''); setProofPhotoFile(null); }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleValidate}
              disabled={!canValidate}
              className={`w-full py-3 px-4 font-medium rounded-lg ${
                canValidate
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-slate-400 bg-slate-200 cursor-not-allowed'
              }`}
            >
              {canValidate ? 'Valider ma présence' : 'Valider ma présence'}
            </button>
          </>
        )}

        {step === STEP.SUBMITTING && (
          <p className="text-slate-600 text-sm" role="status">
            Validation en cours…
          </p>
        )}

        {step === STEP.SUCCESS && (
          <p className="text-green-700 font-medium" role="status">
            Visite validée. Redirection…
          </p>
        )}

        <Link
          to="/my-missions"
          className="mt-6 block text-center text-sm text-slate-500 hover:text-slate-700"
        >
          Retour aux missions
        </Link>
      </div>
    </div>
  );
}

export default VisitCheckin;
