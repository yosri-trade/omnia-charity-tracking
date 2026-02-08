import express from 'express';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

router.use(protect);

/**
 * GET /api/geocode/reverse?lat=...&lon=...
 * Proxy vers Nominatim pour éviter CORS depuis le navigateur.
 */
router.get('/reverse', async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lon required' });
    }
    const url = `${NOMINATIM_URL}?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'OMNIA-Charity-Tracking/1.0 (Backend)' },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Geocoding failed' });
    }
    const data = await response.json();
    res.json({ display_name: data.display_name || '' });
  } catch (err) {
    next(err);
  }
});

export default router;
