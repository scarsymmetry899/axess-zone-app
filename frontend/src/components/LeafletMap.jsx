import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix standard Leaflet default icon URL issues with bundlers
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function LeafletMap({ lat, lng, venueName, venueAddress, height = '220px' }) {
  if (!lat || !lng) return null;

  return (
    <div className="w-full rounded-xl overflow-hidden border border-[#24262D] relative bg-[#111215]" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Dark CartoDB Matter tile layer matching monochromatic Axess aesthetic */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={[lat, lng]} icon={customIcon}>
          <Popup>
            <div className="text-left font-sans">
              <p className="font-grotesk font-bold text-[14px] text-white leading-tight">{venueName}</p>
              <p className="text-[11px] text-[#A1A1AA] mt-1">{venueAddress}</p>
              <div className="mt-2 pt-2 border-t border-[#24262D] flex items-center justify-between text-[10px] text-[#71717A]">
                <span>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</span>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline font-medium"
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
