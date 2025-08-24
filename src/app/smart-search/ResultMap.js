"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic imports for better Cloudflare compatibility
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="loading-spinner inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
        <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری نقشه...</p>
      </div>
    </div>
  )
});

const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Polygon = dynamic(() => import("react-leaflet").then(mod => mod.Polygon), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(mod => mod.CircleMarker), { ssr: false });

// انتظار می‌رود prop جدید: cameraPointsWithStatus = [{lng, lat, status: 'done'|'error'|'pending'}]
export default function ResultMap({ polygon, results, cameraPointsWithStatus = [] }) {
  const [mounted, setMounted] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Simple loading check
    const timer = setTimeout(() => {
      setLeafletLoaded(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || typeof window === "undefined") {
    return (
      <div className="w-full h-[400px] rounded overflow-hidden border mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="loading-spinner inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری نقشه...</p>
        </div>
      </div>
    );
  }

  if (!leafletLoaded) {
    return (
      <div className="w-full h-[400px] rounded overflow-hidden border mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="loading-spinner inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری کتابخانه نقشه...</p>
        </div>
      </div>
    );
  }

  if (!polygon || polygon.length < 3) return null;
  
  // مرکز نقشه را میانگین مختصات چندضلعی قرار بده
  const center = [
    polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length,
    polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length,
  ];

  // Create Leaflet icon dynamically
  const createIcon = () => {
    try {
      if (typeof window !== "undefined" && window.L) {
        return window.L.icon({ 
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", 
          iconSize: [25, 41], 
          iconAnchor: [12, 41] 
        });
      }
      return null;
    } catch (error) {
      console.warn("Failed to create Leaflet icon:", error);
      return null;
    }
  };

  return (
    <div className="w-full h-[400px] rounded overflow-hidden border mb-4">
      <div className="map-container">
        <MapContainer 
          center={center} 
          zoom={13} 
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          boxZoom={true}
          dragging={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <Polygon positions={polygon.map(([lng, lat]) => [lat, lng])} color="blue" />
          {/* نقاط جستجو شده و نشده */}
          {cameraPointsWithStatus.map((pt, idx) => (
            <CircleMarker
              key={idx}
              center={[pt.lat, pt.lng]}
              radius={7}
              pathOptions={{ 
                color: pt.status === 'done' ? 'green' : 'red', 
                fillColor: pt.status === 'done' ? 'green' : 'red', 
                fillOpacity: 0.7 
              }}
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
            
            const icon = createIcon();
            if (!icon) return null;
            
            return (
              <Marker 
                key={"result-"+idx} 
                position={[coords[1], coords[0]]} 
                icon={icon}
              >
                <Popup>
                  <b>{props.name || "نامشخص"}</b><br />
                  امتیاز: {props.rate ?? "ندارد"}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
