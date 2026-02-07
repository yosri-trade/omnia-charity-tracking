import asyncHandler from 'express-async-handler';
import Visit from '../models/Visit.model.js';
import Family from '../models/Family.model.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * POST / - Enregistrer une visite (réalisée ou planifiée)
 */
export const createVisit = asyncHandler(async (req, res) => {
  const { familyId, types, notes, proofPhoto, date, status, resolveUrgency, checkInLocation, assignedTo } =
    req.body;
  const family = await Family.findById(familyId);
  if (!family) {
    throw new AppError('Famille non trouvée.', 404);
  }

  const visitDate = date ? new Date(date) : new Date();
  let visitStatus = status;
  if (!visitStatus) {
    visitStatus = visitDate > new Date() ? 'PLANNED' : 'COMPLETED';
  }

  if (resolveUrgency === true && family.status === 'URGENT') {
    family.status = 'ACTIVE';
    await family.save();
  }

  const visitData = {
    family: familyId,
    volunteer: req.user.id,
    date: visitDate,
    status: visitStatus,
    types: types || [],
    notes: notes || '',
    proofPhoto: visitStatus === 'COMPLETED' ? (proofPhoto || '') : '',
    assignedTo: Array.isArray(assignedTo) ? assignedTo.filter((id) => id) : [],
  };
  if (
    checkInLocation &&
    typeof checkInLocation.lat === 'number' &&
    typeof checkInLocation.lng === 'number'
  ) {
    visitData.checkInLocation = {
      lat: checkInLocation.lat,
      lng: checkInLocation.lng,
      accuracy: typeof checkInLocation.accuracy === 'number' ? checkInLocation.accuracy : undefined,
      recordedAt: checkInLocation.recordedAt ? new Date(checkInLocation.recordedAt) : new Date(),
    };
  }
  const visit = await Visit.create(visitData);
  const populated = await Visit.findById(visit._id)
    .populate('family', 'name address')
    .populate('volunteer', 'name')
    .populate('assignedTo', 'name')
    .populate('completedBy', 'name');
  res.status(201).json({ success: true, data: populated });
});

/**
 * GET /:id - Une visite par ID (pour check-in : récupérer famille + coordonnées)
 */
export const getVisitById = asyncHandler(async (req, res) => {
  const visit = await Visit.findById(req.params.id)
    .populate('family')
    .populate('assignedTo', 'name');
  if (!visit) {
    throw new AppError('Visite non trouvée.', 404);
  }
  const isAdminOrCoordinator = ['ADMIN', 'COORDINATOR'].includes(req.user.role);
  const assignedIds = (visit.assignedTo || []).map((u) => String(u?._id ?? u));
  const isOpenOrAssignedToMe =
    !visit.assignedTo?.length || assignedIds.includes(req.user.id);
  const canAccess =
    isAdminOrCoordinator ||
    (visit.status === 'PLANNED' && isOpenOrAssignedToMe) ||
    (visit.status === 'COMPLETED' && String(visit.completedBy ?? visit.volunteer) === req.user.id);
  if (!canAccess) {
    throw new AppError('Accès à cette visite non autorisé.', 403);
  }
  res.json({ success: true, data: visit });
});

/**
 * GET /my-visits - Visites du bénévole connecté
 * PLANNED : assignedTo vide (mission ouverte) OU assignedTo contient mon ID.
 * COMPLETED : completedBy = moi (ou anciennes visites : volunteer = moi).
 */
export const getMyVisits = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const visits = await Visit.find({
    $or: [
      {
        status: 'PLANNED',
        $or: [
          { assignedTo: { $exists: false } },
          { assignedTo: { $size: 0 } },
          { assignedTo: userId },
        ],
      },
      { status: 'COMPLETED', completedBy: userId },
      { status: 'COMPLETED', completedBy: { $exists: false }, volunteer: userId },
    ],
  })
    .populate('family', 'name address status')
    .populate('assignedTo', 'name')
    .populate('completedBy', 'name')
    .sort({ date: 1 })
    .lean();
  res.json({ success: true, data: visits, count: visits.length });
});

/**
 * GET / - Toutes les visites (pour compteur) - admin/coordinator only
 * Exclut les visites orphelines. Le compteur ne compte que les visites RÉALISÉES (COMPLETED).
 */
export const getAllVisits = asyncHandler(async (req, res) => {
  const visits = await Visit.find()
    .populate('family')
    .sort({ date: -1 })
    .lean();
  const validVisits = visits.filter((v) => v.family != null);
  const completedCount = validVisits.filter((v) => v.status === 'COMPLETED' || v.status == null).length;
  res.json({ success: true, data: validVisits, count: completedCount });
});

/**
 * PATCH /:id/validate - Valider la présence (check-in rigoureux)
 * Passe une visite PLANIFIÉE en RÉALISÉE et met à jour la date.
 */
export const validateVisit = asyncHandler(async (req, res) => {
  const { resolveUrgency, location, proofPhoto } = req.body || {};
  const visit = await Visit.findById(req.params.id)
    .populate('family', 'name address status')
    .populate('volunteer', 'name');
  if (!visit) {
    throw new AppError('Visite non trouvée.', 404);
  }
  const isAdminOrCoordinator = ['ADMIN', 'COORDINATOR'].includes(req.user.role);
  const assignedIds = (visit.assignedTo || []).map((id) => (id?._id ?? id).toString());
  const isAssignedToMe = assignedIds.length === 0 || assignedIds.includes(req.user.id);
  const canValidate = isAdminOrCoordinator || (visit.status === 'PLANNED' && isAssignedToMe);
  if (!canValidate) {
    throw new AppError('Vous ne pouvez pas valider cette visite.', 403);
  }
  if (visit.status === 'COMPLETED') {
    throw new AppError('Cette visite est déjà validée.', 400);
  }
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    throw new AppError('Localisation GPS requise pour valider la présence.', 400);
  }

  if (resolveUrgency === true && visit.family?.status === 'URGENT') {
    await Family.findByIdAndUpdate(visit.family._id, { status: 'ACTIVE' });
  }

  visit.status = 'COMPLETED';
  visit.completedBy = req.user.id;
  visit.date = new Date();
  visit.checkInLocation = {
    lat: location.lat,
    lng: location.lng,
    accuracy: typeof location.accuracy === 'number' ? location.accuracy : undefined,
    recordedAt: new Date(),
  };
  if (proofPhoto && typeof proofPhoto === 'string' && proofPhoto.trim()) {
    visit.proofPhoto = proofPhoto.trim();
  }
  visit.assignedTo = [];
  await visit.save();
  const updated = await Visit.findById(visit._id)
    .populate('family', 'name address')
    .populate('volunteer', 'name')
    .populate('assignedTo', 'name')
    .populate('completedBy', 'name');
  res.json({ success: true, data: updated });
});

/**
 * GET /family/:familyId - Historique des visites pour une famille
 */
export const getVisitsByFamily = asyncHandler(async (req, res) => {
  const { familyId } = req.params;
  const family = await Family.findById(familyId);
  if (!family) {
    throw new AppError('Famille non trouvée.', 404);
  }
  const visits = await Visit.find({ family: familyId })
    .sort({ date: -1 })
    .populate('volunteer', 'name')
    .lean();
  res.json({ success: true, data: visits, count: visits.length });
});
