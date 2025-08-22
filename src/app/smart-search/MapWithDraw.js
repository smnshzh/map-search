"use client";
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";

export default function MapWithDraw({ onPolygonChange, polygon = null }) {
  const [mounted, setMounted] = useState(false);
  const featureGroupRef = useRef();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      import("leaflet-draw").then(() => {
        import("leaflet-draw/dist/leaflet.draw.css");
      });
    }
  }, []);

  if (!mounted || typeof window === "undefined") return null;

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
    <MapContainer
      key="map"
      center={[35.715298, 51.42151]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
  );
}
