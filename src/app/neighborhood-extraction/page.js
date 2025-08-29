'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });
const InteractiveMap = dynamic(() => import('./InteractiveMap'), { ssr: false });

export default function NeighborhoodExtraction() {
  const [settings, setSettings] = useState({ apiDelay: 0.2, pointsPerCity: 15, minSpacingKm: 0.5 });
  const [citiesData, setCitiesData] = useState(null);
  const [selectedCities, setSelectedCities] = useState([]);
  const [cityFilter, setCityFilter] = useState('');

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState([]);

  const [allPointsData, setAllPointsData] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [mapCenter, setMapCenter] = useState([32.4279, 53.6880]);
  const [processingComplete, setProcessingComplete] = useState(false);

  const [additionalPoints, setAdditionalPoints] = useState([]);
  const [additionalProcessingComplete, setAdditionalProcessingComplete] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/cities.geojson');
        const data = await res.json();
        setCitiesData(data);
        if (data?.features?.length) {
          const defaults = data.features.slice(0, Math.min(5, data.features.length)).map((feature) => ({
            name: feature.properties.name,
            state: feature.properties.state,
            feature,
          }));
          setSelectedCities(defaults);
        }
      } catch (e) {
        setErrors((p) => [...p, `خطا در خواندن فایل cities.geojson: ${e.message}`]);
      }
    })();
  }, []);

  const filteredCities = (citiesData?.features || []).filter((feature) => {
    if (!cityFilter) return true;
    return (
      feature.properties.name.toLowerCase().includes(cityFilter.toLowerCase()) ||
      feature.properties.state.toLowerCase().includes(cityFilter.toLowerCase())
    );
  });

  const pointInPolygon = useCallback((point, polygon) => {
    const [x, y] = point;
    const n = polygon.length;
    let inside = false;
    let p1x = polygon[0][0];
    let p1y = polygon[0][1];
    for (let i = 1; i <= n; i++) {
      const p2x = polygon[i % n][0];
      const p2y = polygon[i % n][1];
      if (y > Math.min(p1y, p2y)) {
        if (y <= Math.max(p1y, p2y)) {
          if (x <= Math.max(p1x, p2x)) {
            if (p1y !== p2y) {
              const xinters = ((y - p1y) * (p2x - p1x)) / (p2y - p1y) + p1x;
              if (p1x === p2x || x <= xinters) inside = !inside;
            }
          }
        }
      }
      p1x = p2x;
      p1y = p2y;
    }
    return inside;
  }, []);

  const generatePointsInPolygon = useCallback(
    (polygonCoords, numPoints = 15, minSpacingKm = 0.5) => {
      try {
        let polygon;
        if (polygonCoords.length === 1) polygon = polygonCoords[0];
        else polygon = polygonCoords[0][0];

        const lons = polygon.map((c) => c[0]);
        const lats = polygon.map((c) => c[1]);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        const area = (maxLon - minLon) * (maxLat - minLat);
        const optimalSpacing = Math.sqrt(area / numPoints);
        const minSpacingDegrees = minSpacingKm / 111.0;
        const spacing = Math.max(optimalSpacing, minSpacingDegrees);

        const points = [];
        const gridPoints = [];
        for (let lon = minLon; lon <= maxLon; lon += spacing) {
          for (let lat = minLat; lat <= maxLat; lat += spacing) {
            if (pointInPolygon([lon, lat], polygon)) gridPoints.push([lon, lat]);
          }
        }
        if (gridPoints.length >= numPoints) {
          const step = Math.floor(gridPoints.length / numPoints) || 1;
          for (let i = 0; i < gridPoints.length && points.length < numPoints; i += step) {
            points.push(gridPoints[i]);
          }
        } else {
          points.push(...gridPoints);
          let attempts = 0;
          const maxAttempts = (numPoints - points.length) * 10;
          while (points.length < numPoints && attempts < maxAttempts) {
            const lon = minLon + Math.random() * (maxLon - minLon);
            const lat = minLat + Math.random() * (maxLat - minLat);
            if (pointInPolygon([lon, lat], polygon)) {
              let minDistance = Infinity;
              for (const ep of points) {
                const d = Math.sqrt((lon - ep[0]) ** 2 + (lat - ep[1]) ** 2);
                minDistance = Math.min(minDistance, d);
              }
              if (minDistance >= spacing / 2) points.push([lon, lat]);
            }
            attempts++;
          }
        }
        return points.slice(0, numPoints);
      } catch (e) {
        console.error('Error generating points:', e);
        return [];
      }
    },
    [pointInPolygon]
  );

  const getNeighborhoodData = async (lon, lat) => {
    let requestUrl = `https://reverse-geocoding.raah.ir/v1/features?result_type=neighborhood&location=${lon},${lat}`;
    try {
      // Use internal proxy to bypass CORS
      const proxyUrl = `/api/raah-reverse?result_type=neighborhood&lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}`;

      const res = await fetch(proxyUrl);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();

      // If the API returns GeoJSON FeatureCollection, pick first feature geometry/name
      if (data && Array.isArray(data.features) && data.features.length > 0) {
        const f = data.features[0];
        const name = f.properties?.name || '';
        return { name, geometry: f.geometry };
      }

      // If already in expected shape
      if (data && data.geometry) return data;
      return null;
    } catch (e) {
      if (requestUrl) console.log(requestUrl);
      console.error('Reverse-geocoding error:', e);
      return null;
    }
  };

  const processNeighborhoods = async () => {
    if (!selectedCities.length) {
      setErrors((p) => [...p, 'هیچ شهری برای پردازش انتخاب نشده است!']);
      return;
    }
    setProcessing(true);
    setErrors([]);
    setStatus('در حال آماده‌سازی پردازش...');
    setProgress(0);

    const allNeighborhoods = [];
    const pointsData = [];
    const uniqueGeoms = new Set();

    try {
      for (let cityIdx = 0; cityIdx < selectedCities.length; cityIdx++) {
        const city = selectedCities[cityIdx];
        const feature = city.feature;

        setProgress((cityIdx + 1) / selectedCities.length);
        setStatus(`پردازش شهر ${cityIdx + 1} از ${selectedCities.length}: ${city.name}`);

        // Points
        const geometry = feature.geometry;
        let points = [];
        if (geometry.type === 'Polygon') points = generatePointsInPolygon(geometry.coordinates, settings.pointsPerCity, settings.minSpacingKm);
        else if (geometry.type === 'MultiPolygon') points = generatePointsInPolygon(geometry.coordinates, settings.pointsPerCity, settings.minSpacingKm);
        if (!points.length) {
          setErrors((p) => [...p, `نقطه‌ای در polygon شهر ${city.name} تولید نشد!`]);
          continue;
        }
        pointsData.push({ cityName: city.name, points });

        // For each point call Raah
        for (let i = 0; i < points.length; i++) {
          const [lon, lat] = points[i];
          setStatus(`پردازش نقطه ${i + 1} از ${points.length} در ${city.name}`);
          try {
            const nData = await getNeighborhoodData(lon, lat);
            if (nData && nData.geometry) {
              const featureObj = {
                type: 'Feature',
                properties: {
                  name: nData.name || '',
                  city: city.name,
                  state: city.state,
                  latitude: lat,
                  longitude: lon,
                  sourcePoint: [lon, lat],
                },
                geometry: nData.geometry,
              };
              const hash = JSON.stringify(nData.geometry);
              if (!uniqueGeoms.has(hash)) {
                uniqueGeoms.add(hash);
                allNeighborhoods.push(featureObj);
              }
            }
          } catch (e) {
            console.error('Error processing point', lon, lat, e);
          }
          // API delay
          if (settings.apiDelay > 0) await new Promise((r) => setTimeout(r, settings.apiDelay * 1000));
        }
      }

      setNeighborhoods(allNeighborhoods);
      setAllPointsData(pointsData);
      setProcessingComplete(true);

      // Center
      const lats = [];
      const lons = [];
      pointsData.forEach((c) => c.points.forEach((p) => { lats.push(p[1]); lons.push(p[0]); }));
      if (lats.length) setMapCenter([lats.reduce((a, b) => a + b, 0) / lats.length, lons.reduce((a, b) => a + b, 0) / lons.length]);
      setStatus(`✅ استخراج محلات کامل شد! ${allNeighborhoods.length} محله یافت شد.`);
    } catch (e) {
      setErrors((p) => [...p, `خطا در پردازش: ${e.message}`]);
    } finally {
      setProcessing(false);
    }
  };

  const addAdditionalPoint = (lon, lat) => {
    const np = [lon, lat];
    if (!additionalPoints.some((p) => p[0] === lon && p[1] === lat)) setAdditionalPoints((prev) => [...prev, np]);
  };
  const removeAdditionalPoint = (idx) => setAdditionalPoints((prev) => prev.filter((_, i) => i !== idx));
  const clearAdditionalPoints = () => setAdditionalPoints([]);

  const processAdditionalPoints = async () => {
    if (!additionalPoints.length) return;
    setProcessing(true);
    setStatus('در حال پردازش نقاط اضافی...');

    const uniq = new Set(neighborhoods.map((f) => JSON.stringify(f.geometry)));
    const newFeats = [];
    let totalNew = 0;

    try {
      for (const [lon, lat] of additionalPoints) {
        const nData = await getNeighborhoodData(lon, lat);
        if (nData && nData.geometry) {
          // Determine city by point-in-polygon
          let cityName = 'نامشخص';
          let stateName = 'نامشخص';
          for (const city of selectedCities) {
            const g = city.feature.geometry;
            let poly;
            if (g.type === 'Polygon') poly = g.coordinates[0];
            else if (g.type === 'MultiPolygon') poly = g.coordinates[0][0];
            else continue;
            if (pointInPolygon([lon, lat], poly)) { cityName = city.name; stateName = city.state; break; }
          }
          const feat = {
            type: 'Feature',
            properties: { name: nData.name || '', city: cityName, state: stateName, latitude: lat, longitude: lon, sourcePoint: [lon, lat] },
            geometry: nData.geometry,
          };
          const h = JSON.stringify(nData.geometry);
          if (!uniq.has(h)) { uniq.add(h); newFeats.push(feat); totalNew++; }
        }
        if (settings.apiDelay > 0) await new Promise((r) => setTimeout(r, settings.apiDelay * 1000));
      }
      setNeighborhoods((prev) => [...prev, ...newFeats]);
      setAdditionalProcessingComplete(true);
      setStatus(`✅ پردازش نقاط اضافی کامل شد! ${totalNew} محله جدید اضافه شد.`);
    } catch (e) {
      setErrors((p) => [...p, `خطا در پردازش نقاط اضافی: ${e.message}`]);
    } finally {
      setProcessing(false);
    }
  };

  const downloadGeoJSON = () => {
    if (!neighborhoods.length) return;
    const geojson = { type: 'FeatureCollection', features: neighborhoods };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neighborhoods.geojson';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg border-b border-indigo-200 dark:border-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">استخراج محلات از شهرها</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Neighborhood Extraction Tool</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <Link href="/" className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg">صفحه اصلی</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-indigo-200 dark:border-indigo-700">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">تاخیر بین درخواست‌های API (ثانیه)</label>
                <input type="range" min="0.1" max="2.0" step="0.1" value={settings.apiDelay} onChange={(e) => setSettings((p) => ({ ...p, apiDelay: parseFloat(e.target.value) }))} className="w-full" />
                <span className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">{settings.apiDelay} ثانیه</span>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">تعداد نقاط در هر شهر</label>
                <input type="range" min="5" max="500" step="5" value={settings.pointsPerCity} onChange={(e) => setSettings((p) => ({ ...p, pointsPerCity: parseInt(e.target.value) }))} className="w-full" />
                <span className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">{settings.pointsPerCity} نقطه</span>
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">حداقل فاصله بین نقاط (کیلومتر)</label>
                <input type="range" min="0.1" max="5.0" step="0.1" value={settings.minSpacingKm} onChange={(e) => setSettings((p) => ({ ...p, minSpacingKm: parseFloat(e.target.value) }))} className="w-full" />
                <span className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">{settings.minSpacingKm} کیلومتر</span>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">انتخاب شهر</h3>
                <input type="text" placeholder="جستجو در شهرها..." value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl text-sm" />
                <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                  {filteredCities.map((feature, index) => {
                    const cityName = feature.properties.name;
                    const stateName = feature.properties.state;
                    const isSelected = selectedCities.some((c) => c.name === cityName);
                    return (
                      <label key={index} className="flex items-center p-3 rounded-lg border-2 border-transparent hover:border-indigo-200 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedCities((prev) => [...prev, { name: cityName, state: stateName, feature }]);
                            else setSelectedCities((prev) => prev.filter((c) => c.name !== cityName));
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 mr-3">{cityName} - {stateName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button onClick={processNeighborhoods} disabled={processing || !selectedCities.length} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl">{processing ? 'در حال پردازش...' : 'شروع استخراج محلات'}</button>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {processing && (
              <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 border">
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2"><span>پیشرفت</span><span className="font-medium">{Math.round(progress * 100)}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full" style={{ width: `${progress * 100}%` }} /></div>
                </div>
                <p className="text-sm text-gray-700 font-medium">{status}</p>
              </div>
            )}

            {errors.length > 0 && (
              <div className="bg-red-50/80 border-2 border-red-200 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-red-800 font-bold text-lg">خطاها</h3>
                  <button onClick={() => setErrors([])} className="text-red-600 text-sm bg-red-100 px-3 py-1 rounded-lg">پاک کردن</button>
                </div>
                <ul className="text-red-700 text-sm space-y-2 mb-4">{errors.map((e, i) => (<li key={i}>{e}</li>))}</ul>
              </div>
            )}

            {processingComplete && (
              <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">نتایج استخراج</h2>
                  <button onClick={downloadGeoJSON} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl">دانلود GeoJSON</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="p-6 rounded-2xl text-white text-center shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                    <div className="text-3xl font-bold mb-2">{selectedCities.length}</div>
                    <div className="text-blue-100">شهرهای پردازش شده</div>
                  </div>
                  <div className="p-6 rounded-2xl text-white text-center shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                    <div className="text-3xl font-bold mb-2">{neighborhoods.length}</div>
                    <div className="text-indigo-100">محلات یافت شده</div>
                  </div>
                  <div className="p-6 rounded-2xl text-white text-center shadow-lg bg-gradient-to-br from-purple-500 to-pink-600">
                    <div className="text-3xl font-bold mb-2">{allPointsData.reduce((s, c) => s + c.points.length, 0)}</div>
                    <div className="text-purple-100">نقاط تولید شده</div>
                  </div>
                </div>
              </div>
            )}

            {processingComplete && (
              <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 border">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">نقشه محلات</h2>
                <div className="h-96 rounded-xl overflow-hidden border">
                  <MapComponent citiesData={citiesData} allPointsData={allPointsData} neighborhoods={neighborhoods} additionalPoints={additionalPoints} center={mapCenter} />
                </div>
              </div>
            )}

            {processingComplete && (
              <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 border">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">اضافه کردن نقاط اضافی</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <div className="h-64 rounded-xl overflow-hidden border">
                      <InteractiveMap citiesData={citiesData} allPointsData={allPointsData} neighborhoods={neighborhoods} additionalPoints={additionalPoints} center={mapCenter} onPointAdd={addAdditionalPoint} />
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <input type="number" placeholder="طول جغرافیایی" step="0.000001" className="w-full px-4 py-3 border-2 rounded-xl text-sm" id="manualLon" />
                      <input type="number" placeholder="عرض جغرافیایی" step="0.000001" className="w-full px-4 py-3 border-2 rounded-xl text-sm" id="manualLat" />
                      <button onClick={() => { const lon = parseFloat(document.getElementById('manualLon').value); const lat = parseFloat(document.getElementById('manualLat').value); if (Number.isFinite(lon) && Number.isFinite(lat)) { addAdditionalPoint(lon, lat); document.getElementById('manualLon').value = ''; document.getElementById('manualLat').value = ''; } }} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl">افزودن نقطه</button>
                    </div>
                  </div>
                </div>

                {additionalPoints.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">نقاط اضافی ({additionalPoints.length})</h3>
                      <button onClick={clearAdditionalPoints} className="text-red-600 text-sm bg-red-100 px-4 py-2 rounded-lg">پاک کردن همه</button>
                    </div>
                    <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-xl p-4 border">
                      {additionalPoints.map((p, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
                          <span className="text-sm text-gray-700 font-mono">نقطه {i + 1}: [{p[0].toFixed(6)}, {p[1].toFixed(6)}]</span>
                          <button onClick={() => removeAdditionalPoint(i)} className="text-red-500 text-sm bg-red-100 px-3 py-1 rounded-lg">حذف</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={processAdditionalPoints} disabled={processing} className="mt-4 w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-xl">{processing ? 'در حال پردازش...' : 'پردازش نقاط اضافی'}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
