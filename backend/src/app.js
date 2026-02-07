import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import familyRoutes from './routes/family.routes.js';
import visitRoutes from './routes/visit.routes.js';
import alertRoutes from './routes/alert.routes.js';
import itemRoutes from './routes/item.routes.js';
import userRoutes from './routes/user.routes.js';
import statsRoutes from './routes/stats.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const app = express();

// CORS : en développement, accepter tout localhost (port 5173, 5174, etc.)
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = process.env.FRONTEND_URL || 'http://localhost:5173';
    const allowedList = allowed.split(',').map((u) => u.trim());
    const isLocalhost = origin && /^https?:\/\/localhost(:\d+)?$/.test(origin);
    const isAllowed = !origin || allowedList.includes(origin) || (process.env.NODE_ENV !== 'production' && isLocalhost);
    callback(null, isAllowed);
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Body parser — limite 10 Mo pour accepter les photos preuve (smartphones 3–5 Mo)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

// Health check (optionnel)
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OMNIA Charity Tracking API' });
});

// 404
app.use(notFound);

// Gestion centralisée des erreurs
app.use(errorHandler);

export default app;
