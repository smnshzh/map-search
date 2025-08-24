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
        <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری نقشه...</p>
      </div>
    </div>
  )
});

const Source = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Source), { ssr: false });
const Layer = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Layer), { ssr: false });
const NavigationControl = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.NavigationControl), { ssr: false });

export default function MapboxMapWithDraw({ onPolygonChange, polygon = null }) {
  const [viewState, setViewState] = useState({
    longitude: 54.6892,
    latitude: 32.4279,
    zoom: 5.5
  });
  
  const [mounted, setMounted] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState(polygon);
  const mapRef = useRef();
  const drawRef = useRef();

  // Mapbox access token
  const MAPBOX_TOKEN = 'pk.eyJ1Ijoic21uc2h6aCIsImEiOiJjbWU3YzlpZjEwMnV3MmlzaXFsMTU0ZTYxIn0.JoucB_gPN8eUkeVAv6pi8w';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (polygon && !currentPolygon) {
      setCurrentPolygon(polygon);
    }
  }, [polygon, currentPolygon]);

  const onMapLoad = useCallback((event) => {
    mapRef.current = event.target;
    
    // Wait for map to be fully loaded
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.mapboxgl && mapRef.current) {
        try {
          // Import MapboxDraw dynamically
          import('@mapbox/mapbox-gl-draw').then((MapboxDrawModule) => {
            const MapboxDraw = MapboxDrawModule.default;
            
            // Initialize Mapbox Draw
            drawRef.current = new MapboxDraw({
              displayControlsDefault: false,
              controls: {
                polygon: true,
                trash: true
              },
              defaultMode: 'simple_select'
            });
            
            // Add draw control to map
            mapRef.current.addControl(drawRef.current);
            
            // Listen for draw events
            mapRef.current.on('draw.create', (e) => {
              console.log('Draw create event:', e);
              const features = drawRef.current.getAll();
              if (features.features.length > 0) {
                const newPolygon = features.features[0];
                console.log('New polygon created:', newPolygon);
                setCurrentPolygon(newPolygon);
                if (onPolygonChange) {
                  onPolygonChange(newPolygon);
                }
              }
            });
            
            mapRef.current.on('draw.update', (e) => {
              console.log('Draw update event:', e);
              const features = drawRef.current.getAll();
              if (features.features.length > 0) {
                const updatedPolygon = features.features[0];
                setCurrentPolygon(updatedPolygon);
                if (onPolygonChange) {
                  onPolygonChange(updatedPolygon);
                }
              }
            });
            
            mapRef.current.on('draw.delete', (e) => {
              console.log('Draw delete event:', e);
              setCurrentPolygon(null);
              if (onPolygonChange) {
                onPolygonChange(null);
              }
            });
            
            console.log('MapboxDraw initialized successfully');
          }).catch((error) => {
            console.error('Error loading MapboxDraw:', error);
          });
        } catch (error) {
          console.error('Error initializing MapboxDraw:', error);
        }
      }
    }, 1000); // Wait 1 second for map to fully load
  }, [onPolygonChange]);

  const clearPolygon = useCallback(() => {
    if (drawRef.current) {
      drawRef.current.deleteAll();
      setCurrentPolygon(null);
      if (onPolygonChange) {
        onPolygonChange(null);
      }
    }
  }, [onPolygonChange]);

  const toggleDrawingMode = useCallback(() => {
    if (drawRef.current) {
      if (drawingMode) {
        drawRef.current.changeMode('simple_select');
        setDrawingMode(false);
      } else {
        drawRef.current.changeMode('draw_polygon');
        setDrawingMode(true);
      }
    }
  }, [drawingMode]);

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
      {/* Drawing Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={toggleDrawingMode}
          className={`px-4 py-2 rounded-lg font-semibold shadow-lg transition-all ${
            drawingMode 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {drawingMode ? '🔴 توقف رسم' : '✏️ رسم محدوده'}
        </button>
        
        {currentPolygon && (
          <button
            onClick={clearPolygon}
            className="px-4 py-2 rounded-lg font-semibold shadow-lg bg-red-600 hover:bg-red-700 text-white transition-all"
          >
            🗑️ پاک کردن
          </button>
        )}
      </div>

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
        
        {/* Display current polygon */}
        {currentPolygon && (
          <Source id="polygon-source" type="geojson" data={currentPolygon}>
            <Layer
              id="polygon-fill"
              type="fill"
              paint={{
                'fill-color': '#3B82F6',
                'fill-opacity': 0.3
              }}
            />
            <Layer
              id="polygon-outline"
              type="line"
              paint={{
                'line-color': '#3B82F6',
                'line-width': 2
              }}
            />
          </Source>
        )}
      </Map>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 shadow-lg max-w-xs">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">راهنمای استفاده:</h3>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li>• روی دکمه "رسم محدوده" کلیک کنید</li>
          <li>• روی نقشه کلیک کنید تا نقاط محدوده را ایجاد کنید</li>
          <li>• برای تکمیل، روی نقطه اول دوباره کلیک کنید</li>
          <li>• برای پاک کردن، از دکمه "پاک کردن" استفاده کنید</li>
        </ul>
      </div>
    </div>
  );
}
