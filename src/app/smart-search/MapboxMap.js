"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { cities } from "../cities-data";

// Dynamic import for Mapbox - using v8 syntax with correct path
const Map = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Map), { 
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

const Marker = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Popup), { ssr: false });
const Source = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Source), { ssr: false });
const Layer = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Layer), { ssr: false });

export default function MapboxMap({ selectedCity, selectedNeighborhood, onCitySelect }) {
  const [viewState, setViewState] = useState({
    longitude: 54.6892,
    latitude: 32.4279,
    zoom: 5.5
  });
  
  const [popupInfo, setPopupInfo] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Mapbox access token
  const MAPBOX_TOKEN = 'pk.eyJ1Ijoic21uc2h6aCIsImEiOiJjbWU3YzlpZjEwMnV3MmlzaXFsMTU0ZTYxIn0.JoucB_gPN8eUkeVAv6pi8w';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedNeighborhood && selectedNeighborhood.centerPoint) {
      // If neighborhood is selected, center on it with higher zoom
      setViewState({
        longitude: selectedNeighborhood.centerPoint[0],
        latitude: selectedNeighborhood.centerPoint[1],
        zoom: 14
      });
    } else if (selectedCity) {
      // If only city is selected, center on city
      setViewState({
        longitude: selectedCity.coordinates[0],
        latitude: selectedCity.coordinates[1],
        zoom: 10
      });
    }
  }, [selectedCity, selectedNeighborhood]);

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

  return (
    <div className="w-full h-full relative">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={true}
        logoPosition="bottom-right"
      >
        {/* City markers */}
        {cities.map((city, index) => (
          <Marker
            key={index}
            longitude={city.coordinates[0]}
            latitude={city.coordinates[1]}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setPopupInfo(city);
              if (onCitySelect) {
                onCitySelect(city);
              }
            }}
          >
            <div className="cursor-pointer">
              <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </Marker>
        ))}

        {/* Neighborhood boundary */}
        {selectedNeighborhood && selectedNeighborhood.coordinates && (
          <Source 
            id="neighborhood-boundary" 
            type="geojson" 
            data={{
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [selectedNeighborhood.coordinates]
              }
            }}
          >
            <Layer
              id="neighborhood-fill"
              type="fill"
              paint={{
                'fill-color': '#10B981',
                'fill-opacity': 0.2
              }}
            />
            <Layer
              id="neighborhood-outline"
              type="line"
              paint={{
                'line-color': '#10B981',
                'line-width': 3,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {/* Popup for city info */}
        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.coordinates[0]}
            latitude={popupInfo.coordinates[1]}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            className="city-popup"
          >
            <div className="p-2 text-center">
              <h3 className="font-bold text-lg text-gray-800">{popupInfo.name_fa}</h3>
              <p className="text-sm text-gray-600">{popupInfo.name_en}</p>
              <p className="text-xs text-gray-500 mt-1">
                {popupInfo.coordinates[1].toFixed(4)}, {popupInfo.coordinates[0].toFixed(4)}
              </p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
