import 'leaflet/dist/leaflet.css';
import '../utils/leaflet-heat-init.js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getAllFamilies } from '../services/family.service.js';
import HeatmapLayer from '../components/maps/HeatmapLayer.jsx';
import UserLocationMarker from '../components/maps/UserLocationMarker.jsx';
import AppNavbar from '../components/AppNavbar.jsx';

// Fix des icônes Leaflet (problème courant avec Vite/Webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TUNISIA_CENTER = [34.0, 9.0];
const DEFAULT_ZOOM = 7;

function StatusBadge({ status }) {
  const isUrgent = status === 'URGENT';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isUrgent ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200' : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
      }`}
    >
      {status}
    </span>
  );
}

function MapPage() {
  const { t } = useTranslation();
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const res = await getAllFamilies();
        const all = res.data || [];
        const withCoords = all.filter(
          (f) =>
            f.coordinates &&
            typeof f.coordinates.lat === 'number' &&
            typeof f.coordinates.lng === 'number'
        );
        setFamilies(withCoords);
      } catch (err) {
        setError(err.response?.data?.error || err.message || t('map.loadError'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const count = families.length;
  const familiesLabel = count === 1 ? t('map.familiesLocated', { count: 1 }) : t('map.familiesLocatedPlural', { count });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppNavbar />
      <div className="px-4 py-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600 flex justify-end">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {familiesLabel}
        </span>
      </div>
      <div
        className="relative w-full shrink-0"
        style={{ height: '80vh', minHeight: 400 }}
      >
        <button
          type="button"
          onClick={() => setShowHeatmap((v) => !v)}
          className="absolute top-2 end-2 z-[1000] inline-flex items-center gap-2 min-h-[44px] min-w-[44px] rounded-lg bg-white dark:bg-slate-800 px-3 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-md ring-1 ring-slate-200 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          aria-label={showHeatmap ? t('map.heatmapHide') : t('map.heatmapShow')}
        >
          <span aria-hidden>🔥</span> {showHeatmap ? t('map.heatmapHide') : t('map.heatmapShow')}
        </button>
        <MapContainer
          center={TUNISIA_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {showHeatmap && <HeatmapLayer families={families} />}
          <UserLocationMarker />
          {families.map((family) => (
            <Marker
              key={family._id}
              position={[family.coordinates.lat, family.coordinates.lng]}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{family.name}</p>
                  <div className="mb-2">
                    <StatusBadge status={family.status} />
                  </div>
                  <Link
                    to={`/families/${family._id}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded min-h-[44px] inline-flex items-center"
                  >
                    {t('map.viewDossier')} →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapPage;
