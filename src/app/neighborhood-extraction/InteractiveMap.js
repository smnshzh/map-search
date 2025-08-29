"use client";

import { MapContainer, TileLayer, GeoJSON, useMapEvents, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function ClickHandler({ onPointAdd }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (onPointAdd) onPointAdd(lng, lat);
    },
  });
  return null;
}

export default function InteractiveMap({ citiesData, allPointsData, neighborhoods, additionalPoints, center, onPointAdd }) {
  return (
    <MapContainer center={center || [32.4279, 53.6880]} zoom={6} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <ClickHandler onPointAdd={onPointAdd} />

      {citiesData?.features?.map((feature, idx) => (
        <GeoJSON key={`city-${idx}`} data={feature.geometry} style={() => ({ color: '#3388ff', weight: 2, fillColor: '#3388ff', fillOpacity: 0.1 })} />
      ))}

      {neighborhoods?.map((feat, ni) => (
        <GeoJSON key={`n-${ni}`} data={feat.geometry} style={() => ({ color: '#ff7800', weight: 1, fillColor: '#ff7800', fillOpacity: 0.3 })} />
      ))}

      {additionalPoints?.map(([lon, lat], ai) => (
        <CircleMarker key={`a-${ai}`} center={[lat, lon]} radius={3} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.7 }}>
          <Popup>نقطه اضافی {ai + 1}<br />طول: {lon.toFixed(6)}<br />عرض: {lat.toFixed(6)}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
