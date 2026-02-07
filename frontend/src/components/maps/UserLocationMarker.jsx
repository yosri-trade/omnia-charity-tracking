import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap, Marker } from 'react-leaflet';

const USER_ICON = L.divIcon({
  className: 'user-location-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  html: `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #2563eb;
      border: 3px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      box-sizing: border-box;
    " title="Vous êtes ici"></div>
  `,
});

function UserLocationControl({ map, position }) {
  const controlRef = useRef(null);
  const positionRef = useRef(position);
  positionRef.current = position;

  useEffect(() => {
    if (!map || !position) return;

    const Control = L.Control.extend({
      onAdd() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'user-location-btn';
        btn.innerHTML = '📍 Ma Position';
        btn.title = 'Recentrer sur ma position';
        btn.style.cssText = `
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          cursor: pointer;
          white-space: nowrap;
        `;
        btn.addEventListener('mouseenter', () => {
          btn.style.background = '#f8fafc';
          btn.style.borderColor = '#cbd5e1';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background = 'white';
          btn.style.borderColor = '#e2e8f0';
        });
        btn.addEventListener('click', () => {
          const p = positionRef.current;
          if (p) map.flyTo([p.lat, p.lng], 15, { duration: 0.8 });
        });
        const container = document.createElement('div');
        container.style.margin = '10px';
        container.appendChild(btn);
        return container;
      },
    });

    const control = new Control({ position: 'bottomright' });
    map.addControl(control);
    controlRef.current = control;
    return () => {
      map.removeControl(control);
      controlRef.current = null;
    };
  }, [map, position]);

  return null;
}

function UserLocationMarker() {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('GPS non supporté');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setError(null);
      },
      () => setError('Position indisponible'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return (
    <>
      {position && <Marker position={[position.lat, position.lng]} icon={USER_ICON} />}
      <UserLocationControl map={map} position={position} />
    </>
  );
}

export default UserLocationMarker;
