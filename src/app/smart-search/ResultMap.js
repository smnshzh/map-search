"use client";
import { MapContainer, TileLayer, Polygon, Marker, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// انتظار می‌رود prop جدید: cameraPointsWithStatus = [{lng, lat, status: 'done'|'error'|'pending'}]
export default function ResultMap({ polygon, results, cameraPointsWithStatus = [] }) {
  if (!polygon || polygon.length < 3) return null;
  // مرکز نقشه را میانگین مختصات چندضلعی قرار بده
  const center = [
    polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length,
    polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length,
  ];
  return (
    <div className="w-full h-[400px] rounded overflow-hidden border mb-4">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polygon positions={polygon.map(([lng, lat]) => [lat, lng])} color="blue" />
        {/* نقاط جستجو شده و نشده */}
        {cameraPointsWithStatus.map((pt, idx) => (
          <CircleMarker
            key={idx}
            center={[pt.lat, pt.lng]}
            radius={7}
            pathOptions={{ color: pt.status === 'done' ? 'green' : 'red', fillColor: pt.status === 'done' ? 'green' : 'red', fillOpacity: 0.7 }}
          >
            <Popup>
              {pt.status === 'done' ? 'جستجو شده' : 'جستجو نشده/خطا'}<br />
              [{pt.lat.toFixed(5)}, {pt.lng.toFixed(5)}]
            </Popup>
          </CircleMarker>
        ))}
        {/* مارکر نتایج */}
        {results.map((feature, idx) => {
          const geom = feature.geometry || {};
          const coords = geom.coordinates || [];
          const props = feature.properties || {};
          if (coords.length !== 2) return null;
          return (
            <Marker key={"result-"+idx} position={[coords[1], coords[0]]} icon={L.icon({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] })}>
              <Popup>
                <b>{props.name || "نامشخص"}</b><br />
                امتیاز: {props.rate ?? "ندارد"}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
