import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DEFAULT_CENTER: [number, number] = [-13.1631, -74.2236];

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPickerProps {
  valueLat?: number | null;
  valueLng?: number | null;
  onChange: (lat: number, lng: number) => void;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
      event.target.setView(event.latlng, event.target.getZoom());
    },
  });

  return null;
}

export default function MapPicker({ valueLat, valueLng, onChange }: MapPickerProps) {
  const hasCoords = typeof valueLat === 'number' && typeof valueLng === 'number';
  const center: [number, number] = hasCoords ? [valueLat as number, valueLng as number] : DEFAULT_CENTER;
  const zoom = hasCoords ? 15 : 12;

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {hasCoords && <Marker position={center} icon={defaultIcon} />}
      </MapContainer>
    </div>
  );
}
