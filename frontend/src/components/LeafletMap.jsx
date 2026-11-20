import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom SVG marker pin matching axess.zone green / clean map marker
const createCustomPinIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 14 26 16 28 2-2 16-17.5 16-28 0-8.837-7.163-16-16-16z" fill="#78B833" filter="url(#shadow)"/>
      <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-map-marker',
    html: svg,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -40],
  });
};

const mapPinIcon = createCustomPinIcon();

export default function LeafletMap({ lat, lng, venueName, venueAddress, height = '280px' }) {
  if (!lat || !lng) return null;

  return (
    <div className="w-full rounded-[14px] overflow-hidden border border-[#212121] relative bg-[#111111]" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Official OpenStreetMap tile layer (100% reliable, zero API key required, matches axess.zone) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Marker position={[lat, lng]} icon={mapPinIcon}>
          <Popup>
            <div className="text-left font-sans p-1">
              <p className="font-heading font-bold text-[14px] text-neutral-900 leading-tight">{venueName}</p>
              <p className="text-[12px] text-neutral-600 mt-1">{venueAddress}</p>
              <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
                <span>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</span>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black font-semibold hover:underline"
                >
                  Get Directions &rarr;
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
