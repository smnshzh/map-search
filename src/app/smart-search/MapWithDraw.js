"use client";
import { useEffect, useState, useRef } from "react";
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
const FeatureGroup = dynamic(() => import("react-leaflet").then(mod => mod.FeatureGroup), { ssr: false });
const EditControl = dynamic(() => import("react-leaflet-draw").then(mod => mod.EditControl), { ssr: false });

export default function MapWithDraw({ onPolygonChange, polygon = null }) {
  const [mounted, setMounted] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const featureGroupRef = useRef();

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
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="loading-spinner inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری نقشه...</p>
        </div>
      </div>
    );
  }

  if (!leafletLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="loading-spinner inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری کتابخانه نقشه...</p>
        </div>
      </div>
    );
  }

  const handleCreated = (e) => {
    if (e.layerType === "polygon") {
      const latlngs = e.layer.getLatLngs()[0].map((latlng) => [latlng.lng, latlng.lat]);
      onPolygonChange(latlngs);
    }
  };

  const handleEdited = (e) => {
    const layers = e.layers;
    layers.eachLayer((layer) => {
      if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0].map((latlng) => [latlng.lng, latlng.lat]);
        onPolygonChange(latlngs);
      }
    });
  };

  const handleDeleted = () => {
    onPolygonChange(null);
  };

  return (
    <div className="map-container">
      <MapContainer
        key="map"
        center={[35.715298, 51.42151]}
        zoom={12}
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
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topleft"
            draw={{
              rectangle: true,
              circle: false,
              marker: false,
              polyline: false,
              circlemarker: false,
              polygon: true,
            }}
            edit={{
              edit: true,
              remove: true,
            }}
            onCreated={handleCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
