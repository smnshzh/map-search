"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import CategoryCombobox from "./CategoryCombobox";

// تابع تولید نقاط روی محیط و داخل Polygon
function generateCamerasOnPerimeter(coords, step = 0.0002, internalSpacing = 0.001) {
  if (!coords || coords.length < 3) return [];
  // محیط چندضلعی
  let points = [];
  // محیط
  for (let i = 0; i < coords.length; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[(i + 1) % coords.length];
    const dist = Math.sqrt((lng2 - lng1) ** 2 + (lat2 - lat1) ** 2);
    const steps = Math.max(1, Math.floor(dist / step));
    for (let j = 0; j < steps; j++) {
      const lng = lng1 + ((lng2 - lng1) * j) / steps;
      const lat = lat1 + ((lat2 - lat1) * j) / steps;
      points.push([lng, lat]);
    }
  }
  // نقاط داخلی (شبکه ساده)
  if (internalSpacing) {
    let minLng = Math.min(...coords.map(([lng]) => lng));
    let maxLng = Math.max(...coords.map(([lng]) => lng));
    let minLat = Math.min(...coords.map(([, lat]) => lat));
    let maxLat = Math.max(...coords.map(([, lat]) => lat));
    for (let lng = minLng; lng <= maxLng; lng += internalSpacing) {
      for (let lat = minLat; lat <= maxLat; lat += internalSpacing) {
        // تست داخل بودن نقطه در چندضلعی (ray-casting)
        let inside = false;
        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
          const xi = coords[i][0], yi = coords[i][1];
          const xj = coords[j][0], yj = coords[j][1];
          const intersect = ((yi > lat) !== (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / (yj - yi + 1e-12) + xi);
          if (intersect) inside = !inside;
        }
        if (inside) points.push([lng, lat]);
      }
    }
  }
  return points;
}

const MapWithDraw = dynamic(() => import("./MapWithDraw"), { ssr: false });
const ResultMap = dynamic(() => import("./ResultMap"), { ssr: false });

export default function SmartSearchPage() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [polygon, setPolygon] = useState(null);
  const [cameraPoints, setCameraPoints] = useState([]);
  const [step, setStep] = useState(0.0002);
  const [internalSpacing, setInternalSpacing] = useState(0.001);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [rawResults, setRawResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [poiDetails, setPoiDetails] = useState({});
  const [poiDetailErrors, setPoiDetailErrors] = useState({});
  const [loadingPoiDetails, setLoadingPoiDetails] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 15;
  // حذف categorySearch و filteredCategories

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://search.raah.ir/v6/bundle-list/full/");
        if (!res.ok) throw new Error("خطا در دریافت لیست دسته‌بندی‌ها");
        const data = await res.json();
        const slugDisplay = [];
        for (const mainCat of data.results) {
          for (const subCat of mainCat.categories) {
            slugDisplay.push({
              slug: subCat.slug,
              display: `${mainCat.title} > ${subCat.name}`,
            });
          }
        }
        setCategories(slugDisplay);
      } catch (e) {
        setError(e.message || "خطا در دریافت لیست دسته‌بندی‌ها");
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const handleGenerateCameras = () => {
    if (polygon) {
      const points = generateCamerasOnPerimeter(polygon, step, internalSpacing);
      setCameraPoints(points);
    }
  };

  const handleSearch = async () => {
    if (!selected || !polygon || cameraPoints.length === 0) return;
    setSearching(true);
    setProgress(0);
    setResults([]);
    setRawResults([]);
    setSearchError("");
    setPoiDetails({});
    setPoiDetailErrors({});
    const SEARCH_URL = "https://search.raah.ir/v4/bundle-search/";
    let allFeatures = [];
    let allRaw = [];
    for (let i = 0; i < cameraPoints.length; i++) {
      const [lng, lat] = cameraPoints[i];
      try {
        const params = new URLSearchParams({
          slug: selected,
          polygon: polygon.map(([lng, lat]) => `${lng},${lat}`).join("|"),
          zoom: "14",
          camera: `${lng},${lat}`,
        });
        const res = await fetch(`${SEARCH_URL}?${params.toString()}`);
        if (!res.ok) throw new Error("خطا در جستجو");
        const data = await res.json();
        const features = data.geojson?.features || [];
        allFeatures = allFeatures.concat(features);
        allRaw.push({ camera: [lng, lat], features });
      } catch (e) {
        allRaw.push({ camera: [lng, lat], error: e.message });
      }
      setProgress((i + 1) / cameraPoints.length);
    }
    setResults(allFeatures);
    setRawResults(allRaw);
    setSearching(false);
    // --- دریافت اطلاعات تکمیلی POIها با تلاش مجدد ---
    const tokens = Array.from(new Set(allFeatures.map(f => f.properties?.token).filter(Boolean)));
    if (tokens.length > 0) {
      setLoadingPoiDetails(true);
      const details = {};
      const errors = {};
      for (let i = 0; i < tokens.length; i++) {
        let success = false;
        let lastError = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch(`https://poi.raah.ir/web/v4/${tokens[i]}?format=json`);
            if (res.ok) {
              const data = await res.json();
              details[tokens[i]] = data;
              success = true;
              break;
            } else {
              lastError = `HTTP ${res.status}`;
            }
          } catch (err) {
            lastError = err.message;
          }
        }
        if (!success) {
          errors[tokens[i]] = lastError || "خطا در دریافت اطلاعات";
        }
      }
      setPoiDetails(details);
      setPoiDetailErrors(errors);
      setLoadingPoiDetails(false);
    }
  };

  // ساخت وضعیت نقاط جستجو
  const cameraPointsWithStatus = cameraPoints.map(([lng, lat]) => {
    // اگر در rawResults نقطه‌ای با این مختصات و features وجود دارد => done
    // اگر در rawResults نقطه‌ای با این مختصات و error وجود دارد => error
    // در غیر این صورت => pending
    const found = rawResults.find(r => r.camera[0] === lng && r.camera[1] === lat);
    if (found && found.features && found.features.length > 0) {
      return { lng, lat, status: 'done' };
    } else if (found && found.error) {
      return { lng, lat, status: 'error' };
    } else {
      return { lng, lat, status: 'pending' };
    }
  });

  // فیلتر نتایج جدول بر اساس نام و دسته‌بندی
  const filteredResults = results.filter(feature => {
    const props = feature.properties || {};
    const token = props.token;
    const detail = token ? poiDetails[token] : null;
    const name = (detail?.name || props.name || "").toLowerCase();
    const category = (detail?.category || props.category || "").toLowerCase();
    return (
      name.includes(filterName.toLowerCase()) &&
      category.includes(filterCategory.toLowerCase())
    );
  });
  // صفحه‌بندی
  const pageCount = Math.ceil(filteredResults.length / rowsPerPage) || 1;
  const pagedResults = filteredResults.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  // اگر فیلتر تغییر کرد، صفحه به ۱ برگردد
  useEffect(() => { setPage(1); }, [filterName, filterCategory, results]);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧠 جستجوی هوشمند راه (Raah)</h1>
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">1. انتخاب دسته‌بندی</h2>
        {loading && <div className="text-blue-600">در حال دریافت دسته‌بندی‌ها...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <CategoryCombobox
            categories={categories}
            selected={selected}
            setSelected={setSelected}
          />
        )}
        {selected && (
          <div className="text-green-700 mt-2">دسته‌بندی انتخاب شده: <b>{selected}</b></div>
        )}
      </section>
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">2. تعریف محدوده جستجو (روی نقشه)</h2>
        <p className="mb-2">برای تعریف محدوده جستجو، یک چندضلعی روی نقشه رسم کنید.</p>
        <div className="h-[400px] w-full rounded overflow-hidden border">
          <MapWithDraw onPolygonChange={setPolygon} />
        </div>
        {polygon && (
          <div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
            مختصات چندضلعی انتخاب شده:
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify(polygon, null, 2)}
            </pre>
          </div>
        )}
      </section>
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">3. اجرای جستجوی چندنقطه‌ای</h2>
        <div className="flex gap-2 mb-2">
          <label className="flex items-center gap-1">
            گام محیط:
            <input type="number" step="0.0001" min="0.00005" max="0.01" value={step} onChange={e => setStep(Number(e.target.value))} className="w-20 p-1 border rounded" />
          </label>
          <label className="flex items-center gap-1">
            فاصله داخلی:
            <input type="number" step="0.0001" min="0" max="0.01" value={internalSpacing} onChange={e => setInternalSpacing(Number(e.target.value))} className="w-20 p-1 border rounded" />
          </label>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          onClick={handleGenerateCameras}
          disabled={!polygon}
        >
          تولید نقاط جستجو
        </button>
        {cameraPoints.length > 0 && (
          <div className="mt-2 text-green-700">تعداد نقاط جستجو: <b>{cameraPoints.length}</b></div>
        )}
      </section>
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">4. اجرای جستجو</h2>
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          onClick={handleSearch}
          disabled={!selected || !polygon || cameraPoints.length === 0 || searching}
        >
          {searching ? "در حال جستجو..." : "اجرای جستجو"}
        </button>
        {searching && (
          <div className="mt-2 w-full bg-gray-200 rounded h-4 overflow-hidden">
            <div
              className="bg-green-500 h-4 transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            ></div>
          </div>
        )}
        {results.length > 0 && !searching && (
          <div className="mt-2 text-green-700">تعداد کل نتایج: <b>{results.length}</b></div>
        )}
        {searchError && <div className="text-red-600 mt-2">{searchError}</div>}
      </section>
      {results.length > 0 && !searching && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">5. نمایش نتایج</h2>
          <ResultMap polygon={polygon} results={results} cameraPointsWithStatus={cameraPointsWithStatus} />
          <div className="mt-4 overflow-x-auto">
            <h3 className="font-semibold mb-2">جدول نتایج:</h3>
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2 mb-2 items-center">
              <input
                type="text"
                className="p-2 border rounded min-w-[180px]"
                placeholder="فیلتر بر اساس نام..."
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
              />
              <input
                type="text"
                className="p-2 border rounded min-w-[180px]"
                placeholder="فیلتر بر اساس دسته‌بندی..."
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              />
              <span className="text-xs text-gray-500 ml-2">({filteredResults.length} نتیجه نمایش داده می‌شود)</span>
            </div>
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="border px-2 py-1">#</th>
                  <th className="border px-2 py-1">نام</th>
                  <th className="border px-2 py-1">امتیاز</th>
                  <th className="border px-2 py-1">آدرس</th>
                  <th className="border px-2 py-1">تلفن</th>
                  <th className="border px-2 py-1">دسته‌بندی</th>
                  <th className="border px-2 py-1">مختصات</th>
                  <th className="border px-2 py-1">وضعیت POI</th>
                </tr>
              </thead>
              <tbody>
                {pagedResults.map((feature, idx) => {
                  const props = feature.properties || {};
                  const geom = feature.geometry || {};
                  const coords = geom.coordinates || [];
                  const token = props.token;
                  const detail = token ? poiDetails[token] : null;
                  const error = token ? poiDetailErrors[token] : null;
                  return (
                    <tr key={idx + (page-1)*rowsPerPage} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800">
                      <td className="border px-2 py-1">{idx + 1 + (page-1)*rowsPerPage}</td>
                      <td className="border px-2 py-1">{detail?.name || props.name || "نامشخص"}</td>
                      <td className="border px-2 py-1">{props.rate ?? "ندارد"}</td>
                      <td className="border px-2 py-1">{detail?.fields?.find(f => f.icon === "gps")?.value || "-"}</td>
                      <td className="border px-2 py-1">{detail?.fields?.filter(f => f.icon === "phone").map(f => f.text).join(", ") || "-"}</td>
                      <td className="border px-2 py-1">{detail?.category || props.category || "-"}</td>
                      <td className="border px-2 py-1">{coords.length === 2 ? `[${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}]` : "-"}</td>
                      <td className="border px-2 py-1 text-xs">
                        {error ? <span className="text-red-600">{error}</span> : detail ? <span className="text-green-700">دریافت شد</span> : <span className="text-gray-400">در انتظار</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                قبلی
              </button>
              <span className="mx-2">صفحه {page} از {pageCount}</span>
              <button
                className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
              >
                بعدی
              </button>
            </div>
          </div>
        </section>
      )}
      {/* سایر بخش‌ها اینجا اضافه خواهند شد */}
      <footer className="mt-12 flex justify-center">
        <Link href="/" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded transition">
          🏠 بازگشت به صفحه اصلی
        </Link>
      </footer>
    </main>
  );
}
