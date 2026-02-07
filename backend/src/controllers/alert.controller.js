import asyncHandler from 'express-async-handler';
import Family from '../models/Family.model.js';
import Item from '../models/Item.model.js';
import Visit from '../models/Visit.model.js';

/**
 * GET / - Centre d'opérations (coordinateur)
 * - urgentFamilies : familles URGENT qui n'ont PAS de visite planifiée (PLANNED)
 * - forgottenFamilies : familles dont la dernière visite est > 30 jours OU jamais visitées.
 *   Exclut les familles déjà dans urgentFamilies (status !== URGENT dans l'aggregate).
 * - lowStockItems : items où quantity < minThreshold
 * - recentReports : 3 dernières visites COMPLETED (bénévole + commentaire)
 */
export const getAlerts = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [allUrgent, familyIdsWithPlannedVisit, lowStockItems, recentReports, forgottenFamilies] =
    await Promise.all([
      Family.find({ status: 'URGENT' })
        .sort({ createdAt: -1 })
        .lean(),
      Visit.find({ status: 'PLANNED' })
        .distinct('family')
        .then((ids) => ids.map((id) => id.toString())),
      Item.find({ $expr: { $lt: ['$quantity', '$minThreshold'] } })
        .sort({ quantity: 1 })
        .lean(),
      Visit.find({ status: 'COMPLETED' })
        .sort({ date: -1 })
        .limit(3)
        .populate('family', 'name')
        .populate('volunteer', 'name')
        .populate('completedBy', 'name')
        .lean(),
      Family.aggregate([
        { $match: { status: { $ne: 'URGENT' } } },
        {
          $lookup: {
            from: 'visits',
            let: { familyId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$family', '$$familyId'] },
                  $or: [{ status: 'COMPLETED' }, { status: { $exists: false } }, { status: null }],
                },
              },
              { $sort: { date: -1 } },
              { $limit: 1 },
              { $project: { date: 1, _id: 0 } },
            ],
            as: 'lastVisit',
          },
        },
        { $addFields: { lastVisitDate: { $arrayElemAt: ['$lastVisit.date', 0] } } },
        {
          $match: {
            $or: [{ lastVisitDate: null }, { lastVisitDate: { $lt: thirtyDaysAgo } }],
          },
        },
        { $project: { lastVisit: 0 } },
        { $sort: { createdAt: -1 } },
      ]),
    ]);

  const urgentFamilies = allUrgent.filter(
    (f) => !familyIdsWithPlannedVisit.includes(f._id.toString())
  );

  const reports = recentReports.map((v) => ({
    _id: v._id,
    familyName: v.family?.name || 'Famille',
    volunteerName: v.completedBy?.name || v.volunteer?.name || 'Bénévole',
    notes: v.notes || '',
    date: v.date,
  }));

  res.json({
    success: true,
    data: {
      urgentFamilies,
      forgottenFamilies,
      lowStockItems,
      recentReports: reports,
    },
  });
});
