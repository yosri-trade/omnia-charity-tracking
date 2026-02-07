import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.heat'; // requires window.L (set in leaflet-heat-init.js, imported by MapPage)
import { useMap } from 'react-leaflet';

function buildHeatPoints(families) {
  if (!Array.isArray(families) || families.length === 0) return [];
  return families
    .filter(
      (f) =>
        f.coordinates &&
        typeof f.coordinates.lat === 'number' &&
        typeof f.coordinates.lng === 'number'
    )
    .map((f) => {
      const lat = f.coordinates.lat;
      const lng = f.coordinates.lng;
      const intensity = f.status === 'URGENT' ? 3.0 : 0.5;
      return [lat, lng, intensity];
    });
}

function HeatmapLayer({ families = [] }) {
  const map = useMap();
  const points = useMemo(() => buildHeatPoints(families), [families]);

  useEffect(() => {
    if (!map || typeof L.heatLayer !== 'function') return;
    if (points.length === 0) return;

    const heatLayer = L.heatLayer(points, {
      radius: 35,
      blur: 20,
      maxZoom: 10,
      max: 3.0,
      minOpacity: 0.4,
      gradient: {
        0.2: 'blue',
        0.4: 'cyan',
        0.6: 'lime',
        0.8: 'orange',
        1.0: 'red',
      },
    });
    map.addLayer(heatLayer);
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

export default HeatmapLayer;
