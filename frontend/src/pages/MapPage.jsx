import 'leaflet/dist/leaflet.css';
import '../utils/leaflet-heat-init.js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getAllFamilies } from '../services/family.service.js';
import HeatmapLayer from '../components/maps/HeatmapLayer.jsx';
import UserLocationMarker from '../components/maps/UserLocationMarker.jsx';

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
        isUrgent ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
      }`}
    >
      {status}
    </span>
  );
}

function MapPage() {
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
        setError(err.response?.data?.error || err.message || 'Erreur lors du chargement.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex gap-3">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-800">
            ← Tableau de bord
          </Link>
          <Link to="/alerts" className="text-sm text-red-600 hover:text-red-800">
            🔔 Alertes
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center bg-slate-100">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex gap-3">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-800">
            ← Tableau de bord
          </Link>
          <Link to="/alerts" className="text-sm text-red-600 hover:text-red-800">
            🔔 Alertes
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center bg-slate-100">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="relative z-10 shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
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
        <span className="text-sm text-slate-500">
          {families.length} famille{families.length !== 1 ? 's' : ''} géolocalisée{families.length !== 1 ? 's' : ''}
        </span>
      </header>
      <div
        className="relative w-full shrink-0"
        style={{ height: '80vh', minHeight: 400 }}
      >
        <button
          type="button"
          onClick={() => setShowHeatmap((v) => !v)}
          className="absolute top-2 right-2 z-[1000] inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-md ring-1 ring-slate-200 hover:bg-slate-50"
          title={showHeatmap ? 'Masquer la heatmap' : 'Afficher la heatmap'}
        >
          🔥 {showHeatmap ? 'Masquer Heatmap' : 'Afficher Heatmap'}
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
                  <p className="font-semibold text-slate-800 mb-1">{family.name}</p>
                  <div className="mb-2">
                    <StatusBadge status={family.status} />
                  </div>
                  <Link
                    to={`/families/${family._id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Voir le dossier →
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
