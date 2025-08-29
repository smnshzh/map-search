"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapComponent({ citiesData, allPointsData, neighborhoods, additionalPoints, center }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const cityOnEach = useMemo(() => (
    (feature, layer) => {
      const name = feature?.properties?.name || 'شهر';
      const state = feature?.properties?.state ? ` - ${feature.properties.state}` : '';
      layer.bindTooltip(`${name}${state}`, { direction: 'top', sticky: true });
    }
  ), []);

  const neighborhoodOnEach = useMemo(() => (
    (feature, layer) => {
      const name = feature?.properties?.name || 'محله';
      const city = feature?.properties?.city ? ` - ${feature.properties.city}` : '';
      layer.bindTooltip(`${name}${city}`, { direction: 'top', sticky: true });
    }
  ), []);

  if (!mounted) {
    return <div style={{ height: '100%', width: '100%' }} />;
  }

  return (
    <MapContainer center={center || [32.4279, 53.6880]} zoom={6} style={{ height: '100%', width: '100%' }} preferCanvas>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

      {citiesData?.features?.map((feature, idx) => (
        <GeoJSON key={`city-${idx}`} data={feature} style={() => ({ color: '#3388ff', weight: 2, fillColor: '#3388ff', fillOpacity: 0.1 })} onEachFeature={cityOnEach} />
      ))}

      {allPointsData?.map((city, ci) =>
        city.points.map(([lon, lat], pi) => (
          <CircleMarker key={`p-${ci}-${pi}`} center={[lat, lon]} radius={3} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.7 }}>
            <Tooltip direction="top" offset={[0, -6]} sticky>
              نقطه {pi + 1} - {city.cityName}
            </Tooltip>
            <Popup>نقطه {pi + 1} - {city.cityName}<br />طول: {lon.toFixed(6)}<br />عرض: {lat.toFixed(6)}</Popup>
          </CircleMarker>
        ))
      )}

      {neighborhoods?.map((feat, ni) => (
        <GeoJSON key={`n-${ni}`} data={feat} style={() => ({ color: '#ff7800', weight: 1, fillColor: '#ff7800', fillOpacity: 0.3 })} onEachFeature={neighborhoodOnEach} />
      ))}

      {additionalPoints?.map(([lon, lat], ai) => (
        <CircleMarker key={`a-${ai}`} center={[lat, lon]} radius={3} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.7 }}>
          <Tooltip direction="top" offset={[0, -6]} sticky>
            نقطه اضافی {ai + 1}
          </Tooltip>
          <Popup>نقطه اضافی {ai + 1}<br />طول: {lon.toFixed(6)}<br />عرض: {lat.toFixed(6)}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
