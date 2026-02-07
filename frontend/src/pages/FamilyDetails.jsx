import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext.jsx';
import { getFamilyById } from '../services/family.service.js';
import { getVisitsByFamily, validateVisit } from '../services/visit.service.js';
import { calculateDistance } from '../utils/geo.js';
import { generateImpactStory } from '../utils/storyGenerator.js';
import AddVisitModal from '../components/families/AddVisitModal.jsx';

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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function FamilyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [family, setFamily] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [validatingId, setValidatingId] = useState(null);
  const [gpsStatus, setGpsStatus] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const [familyRes, visitsRes] = await Promise.all([
        getFamilyById(id),
        getVisitsByFamily(id),
      ]);
      setFamily(familyRes.data);
      const raw = visitsRes.data || [];
      const now = new Date();
      const sorted = [...raw].sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        const aPlanned = a.status === 'PLANNED' || aDate > now;
        const bPlanned = b.status === 'PLANNED' || bDate > now;
        if (aPlanned && !bPlanned) return -1;
        if (!aPlanned && bPlanned) return 1;
        if (aPlanned && bPlanned) return aDate - bDate;
        return bDate - aDate;
      });
      setVisits(sorted);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleValidatePresence = async (visit) => {
    if (!window.confirm('Confirmer que vous êtes bien sur place ?')) return;
    let resolveUrgency = false;
    if (family?.status === 'URGENT') {
      resolveUrgency = window.confirm(
        'La famille est notée URGENTE. Cette visite a-t-elle résolu le problème ?\n\n' +
          'Cliquez sur OK pour passer la famille en ACTIVE.\n' +
          'Cliquez sur Annuler pour garder le statut URGENT.'
      );
    }
    setValidatingId(visit._id);
    setGpsStatus('locating');

    const MAX_DISTANCE_METERS = 500;

    const onGpsSuccess = async (position) => {
      const volunteerLat = position.coords.latitude;
      const volunteerLng = position.coords.longitude;
      const location = {
        lat: volunteerLat,
        lng: volunteerLng,
        accuracy: position.coords.accuracy,
      };

      const familyLat = family?.coordinates?.lat;
      const familyLng = family?.coordinates?.lng;
      const familyHasCoords =
        typeof familyLat === 'number' && typeof familyLng === 'number';

      if (!familyHasCoords) {
        window.alert(
          'Attention : Cette famille n\'est pas géolocalisée, validation acceptée exceptionnellement.'
        );
      } else {
        const distanceM = Math.round(
          calculateDistance(volunteerLat, volunteerLng, familyLat, familyLng)
        );
        if (distanceM > MAX_DISTANCE_METERS) {
          window.alert(
            `⛔ Vous êtes trop loin ! Distance : ${distanceM} mètres. Rapprochez-vous du domicile.`
          );
          setValidatingId(null);
          setGpsStatus(null);
          return;
        }
      }

      setGpsStatus('validating');
      try {
        await validateVisit(visit._id, { resolveUrgency, location });
        await loadData();
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Erreur lors de la validation.');
      } finally {
        setValidatingId(null);
        setGpsStatus(null);
      }
    };

    const onGpsError = () => {
      window.alert(
        'Impossible de valider sans GPS. Veuillez autoriser la localisation dans les paramètres du navigateur.'
      );
      setValidatingId(null);
      setGpsStatus(null);
    };

    if (!navigator.geolocation) {
      window.alert(
        'Impossible de valider sans GPS. Votre navigateur ne supporte pas la géolocalisation.'
      );
      setValidatingId(null);
      setGpsStatus(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(onGpsSuccess, onGpsError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  };

  const generateImpactReport = () => {
    console.log('Génération du rapport lancée...');
    try {
      if (!family) {
        window.alert('Données manquantes : la famille n\'est pas chargée.');
        return;
      }
      if (!Array.isArray(visits)) {
        window.alert('Données manquantes : l\'historique des visites est indisponible.');
        return;
      }

      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text("RAPPORT D'IMPACT - OMNIA CHARITY", pageW / 2, y, { align: 'center' });
      y += 10;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        pageW - margin,
        y,
        { align: 'right' }
      );
      y += 16;

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Informations Famille', margin, y);
      y += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Nom : ${family.name || '—'}`, margin, y);
      y += 6;
      doc.text(`Adresse : ${family.address || '—'}`, margin, y);
      y += 6;
      doc.text(`Téléphone : ${family.phone || '—'}`, margin, y);
      y += 6;
      doc.text(`Besoins : ${family.needs?.length ? family.needs.join(', ') : '—'}`, margin, y);
      y += 6;
      doc.setFont(undefined, 'bold');
      doc.text(`Statut : ${family.status === 'URGENT' ? 'URGENT' : 'ACTIVE'}`, margin, y);
      y += 14;

      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('Historique des Interventions', margin, y);
      y += 8;

      const tableHead = [['Date', 'Bénévole', "Type d'aide", 'Statut', 'Preuve']];
      const tableBody =
        visits.length > 0
          ? visits.map((v) => {
              const dateStr = v.date
                ? new Date(v.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—';
              const volunteer = v.volunteer?.name || '—';
              const types = Array.isArray(v.types) && v.types.length ? v.types.join(', ') : '—';
              const statut = v.status === 'PLANNED' ? 'Planifiée' : 'Réalisée';
              const preuve = v.proofPhoto && v.proofPhoto.trim() ? 'Oui' : '—';
              return [dateStr, volunteer, types, statut, preuve];
            })
          : [['Aucune intervention enregistrée', '—', '—', '—', '—']];

      const tableOptions = {
        head: tableHead,
        body: tableBody,
        startY: y,
        margin: { left: margin },
        headStyles: { fillColor: [71, 85, 105], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      };
      if (typeof doc.autoTable === 'function') {
        doc.autoTable(tableOptions);
      } else {
        autoTable(doc, tableOptions);
      }
      y = doc.lastAutoTable.finalY + 16;

      const visitsWithPhoto = visits.filter((v) => v.proofPhoto && String(v.proofPhoto).trim().length > 0);
      if (visitsWithPhoto.length > 0) {
        const imgW = 80;
        const imgH = 60;
        const colWidth = pageW - 2 * margin;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text('Photos de preuve', margin, y);
        y += 8;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        for (const v of visitsWithPhoto) {
          const dateLabel = v.date
            ? new Date(v.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—';
          if (y + imgH + 14 > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            y = 20;
          }
          doc.setTextColor(60, 60, 60);
          doc.text(dateLabel, margin, y);
          y += 5;
          try {
            const format = String(v.proofPhoto).startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(v.proofPhoto, format, margin, y, imgW, imgH);
          } catch (e) {
            doc.text('(Image non disponible)', margin, y + imgH / 2);
          }
          y += imgH + 10;
        }
        y += 6;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Ce document est un justificatif de suivi généré par la plateforme OMNIA Tracking.',
        pageW / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );

      const safeName = (family.name || 'Famille').replace(/[^\w\s\u00C0-\u024F-]/gi, '').trim() || 'Famille';
      const fileName = `Rapport_Impact_${safeName}.pdf`;
      doc.save(fileName);
      console.log('Rapport PDF généré avec succès:', fileName);
    } catch (error) {
      console.error(error);
      window.alert('Erreur lors de la génération du PDF : ' + (error?.message || String(error)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <p className="text-red-600 mb-4">{error || 'Famille non trouvée.'}</p>
        <Link to="/" className="text-blue-600 hover:underline">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-slate-600 hover:text-slate-800">
              ← Tableau de bord
            </Link>
            <Link to="/alerts" className="text-sm text-red-600 hover:text-red-800">
              🔔 Alertes
            </Link>
            <Link to="/inventory" className="text-sm text-slate-600 hover:text-slate-800">
              📦 Stocks
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* En-tête famille */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-semibold text-slate-800">{family.name}</h1>
            <StatusBadge status={family.status} />
          </div>
          <dl className="space-y-2 text-sm">
            {family.address && (
              <div>
                <dt className="text-slate-500">Adresse</dt>
                <dd className="text-slate-800">{family.address}</dd>
              </div>
            )}
            {family.phone && (
              <div>
                <dt className="text-slate-500">Téléphone</dt>
                <dd className="text-slate-800">{family.phone}</dd>
              </div>
            )}
            {family.needs?.length > 0 && (
              <div>
                <dt className="text-slate-500">Besoins</dt>
                <dd className="text-slate-800">{family.needs.join(', ')}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Carte Histoire d'impact */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50 p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-3">
            <span aria-hidden>✨</span> L&apos;Histoire d&apos;Impact (Généré par Omnia)
          </h2>
          <p className="text-slate-700 text-sm leading-relaxed">
            {generateImpactStory(family, visits)}
          </p>
        </div>

        {/* Historique des visites */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Historique des visites</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generateImpactReport}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-lg hover:bg-slate-700"
            >
              📄 Télécharger Rapport
            </button>
            <button
              onClick={() => setIsVisitModalOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Nouvelle visite
            </button>
          </div>
        </div>

        <AddVisitModal
          isOpen={isVisitModalOpen}
          onClose={() => setIsVisitModalOpen(false)}
          familyId={id}
          familyStatus={family?.status}
          familyCoordinates={family?.coordinates}
          onSuccess={() => {
            setLoading(true);
            loadData();
          }}
        />

        {visits.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            Aucune visite enregistrée
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
            <ul className="space-y-0">
              {visits.map((visit) => {
                const isPlanned =
                  visit.status === 'PLANNED' ||
                  (visit.status !== 'COMPLETED' && new Date(visit.date) > new Date());
                return (
                  <li key={visit._id} className="relative pl-12 pb-8">
                    <div
                      className={`absolute left-0 w-3 h-3 rounded-full border-2 border-white shadow ${
                        isPlanned ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                    />
                    <div
                      className={`rounded-xl border p-4 ${
                        isPlanned
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-slate-800">
                          {formatDate(visit.date)}
                          {visit.checkInLocation && (
                            <span className="ml-1.5 text-slate-500" title="Validé par GPS">
                              📍 Validé par GPS
                            </span>
                          )}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isPlanned
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {isPlanned ? '📅 Planifiée' : (
                            <>✅ Réalisée{visit.proofPhoto?.trim() ? ' 📷' : ''}</>
                          )}
                        </span>
                        {visit.status === 'PLANNED' && (
                          <button
                            type="button"
                            onClick={() => handleValidatePresence(visit)}
                            disabled={validatingId === visit._id}
                            className="ml-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md ring-2 ring-green-500/30"
                          >
                            {validatingId === visit._id ? (
                              gpsStatus === 'locating' ? (
                                <span className="animate-pulse">📍 Localisation en cours...</span>
                              ) : (
                                <span className="animate-pulse">Validation...</span>
                              )
                            ) : (
                              '✅ Valider présence'
                            )}
                          </button>
                        )}
                      </div>
                    {visit.volunteer?.name && (
                      <p className="text-xs text-slate-500 mb-2">
                        Par {visit.volunteer.name}
                      </p>
                    )}
                    {visit.types?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {visit.types.map((t) => (
                          <span
                            key={t}
                            className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {visit.notes && (
                      <p className="text-sm text-slate-600">{visit.notes}</p>
                    )}
                        </div>
                        {visit.proofPhoto?.trim() && (
                          <button
                            type="button"
                            onClick={() => setLightboxImage(visit.proofPhoto)}
                            className="flex-shrink-0 w-[60px] h-[60px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Voir la photo preuve"
                          >
                            <img
                              src={visit.proofPhoto}
                              alt="Photo preuve"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        )}
                      </div>
                  </div>
                </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Lightbox photo preuve */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightboxImage(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Photo preuve en grand"
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 text-slate-800 flex items-center justify-center text-xl hover:bg-white"
              aria-label="Fermer"
            >
              ×
            </button>
            <img
              src={lightboxImage}
              alt="Photo preuve"
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default FamilyDetails;
