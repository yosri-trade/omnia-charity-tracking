import asyncHandler from 'express-async-handler';
import Family from '../models/Family.model.js';
import Visit from '../models/Visit.model.js';

/**
 * GET /stats - Tableau de bord global (admin / coordinateur)
 */
export const getStats = asyncHandler(async (req, res) => {
  const [families, visits] = await Promise.all([
    Family.find().lean(),
    Visit.find().populate('family').lean(),
  ]);
  const validVisits = visits.filter((v) => v.family != null);
  const totalFamilies = families.length;
  const urgentFamilies = families.filter((f) => f.status === 'URGENT').length;
  const visitsCount = validVisits.filter((v) => v.status === 'COMPLETED' || v.status == null).length;

  res.json({
    success: true,
    data: {
      totalFamilies,
      urgentFamilies,
      visitsCount,
      families,
      visits: validVisits,
    },
  });
});
