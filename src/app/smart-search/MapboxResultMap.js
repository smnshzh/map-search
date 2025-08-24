"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamic import for Mapbox - using v8 syntax with correct path
const Map = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Map), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="loading-spinner inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
        <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری نقشه نتایج...</p>
      </div>
    </div>
  )
});

const Source = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Source), { ssr: false });
const Layer = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Layer), { ssr: false });
const Marker = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Popup), { ssr: false });
const NavigationControl = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.NavigationControl), { ssr: false });

export default function MapboxResultMap({ polygon, results, cameraPointsWithStatus = [] }) {
  const [viewState, setViewState] = useState({
    longitude: 54.6892,
    latitude: 32.4279,
    zoom: 5.5
  });
  
  const [mounted, setMounted] = useState(false);
  const [popupInfo, setPopupInfo] = useState(null);
  const [mapRef, setMapRef] = useState(null);

  // Mapbox access token
  const MAPBOX_TOKEN = 'pk.eyJ1Ijoic21uc2h6aCIsImEiOiJjbWU3YzlpZjEwMnV3MmlzaXFsMTU0ZTYxIn0.JoucB_gPN8eUkeVAv6pi8w';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate center and zoom based on polygon or results
  useEffect(() => {
    if (polygon && polygon.geometry) {
      const coordinates = polygon.geometry.coordinates[0];
      if (coordinates.length > 0) {
        const lngs = coordinates.map(coord => coord[0]);
        const lats = coordinates.map(coord => coord[1]);
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        
        setViewState({
          longitude: centerLng,
          latitude: centerLat,
          zoom: 12
        });
      }
    } else if (results && results.length > 0) {
      // Center on first result
      const firstResult = results[0];
      if (firstResult.lat && firstResult.lng) {
        setViewState({
          longitude: firstResult.lng,
          latitude: firstResult.lat,
          zoom: 10
        });
      }
    }
  }, [polygon, results]);

  const onMapLoad = useCallback((event) => {
    setMapRef(event.target);
  }, []);

  const handleMarkerClick = useCallback((result) => {
    setPopupInfo(result);
  }, []);

  if (!mounted || typeof window === "undefined") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="loading-spinner inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری نقشه نتایج...</p>
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
        onLoad={onMapLoad}
      >
        <NavigationControl position="top-right" />
        
        {/* Display search polygon */}
        {polygon && (
          <Source id="search-polygon" type="geojson" data={polygon}>
            <Layer
              id="search-polygon-fill"
              type="fill"
              paint={{
                'fill-color': '#10B981',
                'fill-opacity': 0.2
              }}
            />
            <Layer
              id="search-polygon-outline"
              type="line"
              paint={{
                'line-color': '#10B981',
                'line-width': 3,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {/* Display camera points with status */}
        {cameraPointsWithStatus.map((point, index) => (
          <Marker
            key={`camera-${index}`}
            longitude={point.lng}
            latitude={point.lat}
            anchor="bottom"
            onClick={() => handleMarkerClick({
              name: point.name || `دوربین ${index + 1}`,
              status: point.status,
              coordinates: [point.lng, point.lat]
            })}
          >
            <div className="cursor-pointer">
              <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                point.status === 'active' ? 'bg-green-500' : 
                point.status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'
              }`}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </Marker>
        ))}

        {/* Display search results */}
        {results && results.map((result, index) => (
          <Marker
            key={`result-${index}`}
            longitude={result.lng}
            latitude={result.lat}
            anchor="bottom"
            onClick={() => handleMarkerClick(result)}
          >
            <div className="cursor-pointer">
              <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </Marker>
        ))}

        {/* Popup for result info */}
        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.lng || popupInfo.coordinates?.[0]}
            latitude={popupInfo.lat || popupInfo.coordinates?.[1]}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            className="result-popup"
          >
            <div className="p-3 text-center min-w-[200px]">
              <h3 className="font-bold text-lg text-gray-800 mb-2">
                {popupInfo.name || popupInfo.title || 'نقطه مورد نظر'}
              </h3>
              {popupInfo.status && (
                <p className={`text-sm font-semibold mb-2 ${
                  popupInfo.status === 'active' ? 'text-green-600' : 
                  popupInfo.status === 'inactive' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  وضعیت: {popupInfo.status === 'active' ? 'فعال' : 
                          popupInfo.status === 'inactive' ? 'غیرفعال' : 'نامشخص'}
                </p>
              )}
              {popupInfo.description && (
                <p className="text-sm text-gray-600 mb-2">{popupInfo.description}</p>
              )}
              {popupInfo.category && (
                <p className="text-xs text-gray-500">دسته: {popupInfo.category}</p>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 shadow-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">راهنما:</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">دوربین فعال</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">دوربین غیرفعال</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">نتیجه جستجو</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded opacity-20"></div>
            <span className="text-gray-700 dark:text-gray-300">محدوده جستجو</span>
          </div>
        </div>
      </div>
    </div>
  );
}
