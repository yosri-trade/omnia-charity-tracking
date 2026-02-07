/**
 * Expose Leaflet on window so leaflet.heat (UMD) can attach L.heatLayer.
 * Must be imported before any module that imports 'leaflet.heat'.
 */
import L from 'leaflet';
if (typeof window !== 'undefined') {
  window.L = L;
}
