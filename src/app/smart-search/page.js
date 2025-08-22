"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import CategoryCombobox from "./CategoryCombobox";
import { createClient } from '@supabase/supabase-js';

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

// تابع sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  const [loadingPoiTokens, setLoadingPoiTokens] = useState({}); // وضعیت دریافت هر توکن
  const [filterName, setFilterName] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 15;
  const [poiTokens, setPoiTokens] = useState([]);
  const [retryingToken, setRetryingToken] = useState(null);
  const [dbType, setDbType] = useState("sqlite");
  const [dbConn, setDbConn] = useState("");
  const [dbData, setDbData] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState("disconnected"); // 'disconnected' | 'connecting' | 'connected' | 'error'
  const [dbStatusMsg, setDbStatusMsg] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [supabase, setSupabase] = useState(null);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [creatingTable, setCreatingTable] = useState(false);
  const [serviceRoleKey, setServiceRoleKey] = useState("");
  const createTableSQL = `create table if not exists poi_details (
  token text primary key,
  name text,
  address text,
  category text,
  rate float,
  coords text
);`;
  // حذف categorySearch و filteredCategories
  const [dbTransferErrors, setDbTransferErrors] = useState([]);

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
    setPoiTokens([]);
    setLoadingPoiTokens({});
    const SEARCH_URL = "https://search.raah.ir/v4/bundle-search/";
    let allFeatures = [];
    let allRaw = [];
    let allPoiTokens = [];
    for (let i = 0; i < cameraPoints.length; i++) {
      const [lng, lat] = cameraPoints[i];
      try {
        const params = new URLSearchParams({
          slug: selected,
          zoom: "14",
          camera: `${lng},${lat}`,
        });
        const res = await fetch(`${SEARCH_URL}?${params.toString()}`);
        if (!res.ok) throw new Error("خطا در جستجو");
        const data = await res.json();
        const features = data.geojson?.features || [];
        const tokens = data["poi-tokens"] || [];
        allFeatures = allFeatures.concat(features);
        allPoiTokens = allPoiTokens.concat(tokens);
        allRaw.push({ camera: [lng, lat], features });
      } catch (e) {
        allRaw.push({ camera: [lng, lat], error: e.message });
      }
      setProgress((i + 1) / cameraPoints.length);
    }
    setResults(allFeatures);
    setRawResults(allRaw);
    setPoiTokens(allPoiTokens);
    setSearching(false);
    // --- دریافت اطلاعات تکمیلی POIها با تلاش مجدد ---
    const tokens = Array.from(new Set(allPoiTokens.filter(Boolean)));
    if (tokens.length > 0) {
      setLoadingPoiDetails(true);
      const details = {};
      const errors = {};
      let loadingTokens = {};
      for (let i = 0; i < tokens.length; i++) {
        loadingTokens[tokens[i]] = true;
        setLoadingPoiTokens({ ...loadingTokens });
        let success = false;
        let lastError = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch(`https://poi.raah.ir/web/v4/${tokens[i]}?format=json`);
            if (res.ok) {
              const data = await res.json();
              details[tokens[i]] = data;
              setPoiDetails(prev => ({ ...prev, [tokens[i]]: data })); // آپدیت لحظه‌ای
              setPoiDetailErrors(prev => {
                const copy = { ...prev };
                delete copy[tokens[i]];
                return copy;
              });
              success = true;
              break;
            } else {
              lastError = `HTTP ${res.status}`;
              if (res.status === 429) await sleep(5000);
            }
          } catch (err) {
            lastError = err.message;
          }
        }
        if (!success) {
          errors[tokens[i]] = lastError || "خطا در دریافت اطلاعات";
          setPoiDetailErrors(prev => ({ ...prev, [tokens[i]]: lastError || "خطا در دریافت اطلاعات" }));
        }
        delete loadingTokens[tokens[i]];
        setLoadingPoiTokens({ ...loadingTokens });
      }
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
  // سورت جدول نتایج
  const [sortField, setSortField] = useState("#");
  const [sortDir, setSortDir] = useState("asc"); // asc | desc
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };
  // تابع مرتب‌سازی داده‌ها
  const sortedResults = [...filteredResults].sort((a, b) => {
    const getVal = (row, field) => {
      const props = row.properties || {};
      const token = props.token;
      const detail = token ? poiDetails[token] : null;
      const geom = row.geometry || {};
      const coords = geom.coordinates || [];
      switch (field) {
        case "نام": return (detail?.name || props.name || "").toLowerCase();
        case "امتیاز": return props.rate ?? 0;
        case "دسته‌بندی": return (detail?.category || props.category || "").toLowerCase();
        case "poitoken": return token || "";
        default: return 0;
      }
    };
    const vA = getVal(a, sortField);
    const vB = getVal(b, sortField);
    if (vA < vB) return sortDir === "asc" ? -1 : 1;
    if (vA > vB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
  // صفحه‌بندی روی داده مرتب‌شده
  const pagedResults = sortedResults.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // اگر فیلتر تغییر کرد، صفحه به ۱ برگردد
  useEffect(() => { setPage(1); }, [filterName, filterCategory, results]);

  // تابع دریافت مجدد اطلاعات یک توکن خاص
  const retryFetchPoiDetail = async (token) => {
    setRetryingToken(token);
    setLoadingPoiTokens(prev => ({ ...prev, [token]: true }));
    let success = false;
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`https://poi.raah.ir/web/v4/${token}?format=json`);
        if (res.ok) {
          const data = await res.json();
          setPoiDetails(prev => ({ ...prev, [token]: data }));
          setPoiDetailErrors(prev => {
            const copy = { ...prev };
            delete copy[token];
            return copy;
          });
          success = true;
          break;
        } else {
          lastError = `HTTP ${res.status}`;
          if (res.status === 429) await sleep(5000);
        }
      } catch (err) {
        lastError = err.message;
      }
    }
    if (!success) {
      setPoiDetailErrors(prev => ({ ...prev, [token]: lastError || "خطا در دریافت اطلاعات" }));
    }
    setRetryingToken(null);
    setLoadingPoiTokens(prev => {
      const copy = { ...prev };
      delete copy[token];
      return copy;
    });
  };

  // دکمه فراخوانی مجدد همه
  const retryAllFailed = async () => {
    const failedTokens = pagedResults
      .map((feature, idx) => {
        const globalIdx = (page - 1) * rowsPerPage + idx;
        return poiTokens[globalIdx] || null;
      })
      .filter(token => token && poiDetailErrors[token]);
    for (const token of failedTokens) {
      await retryFetchPoiDetail(token);
    }
  };
  // انتقال داده به دیتابیس (Supabase یا mock)
  const handleTransferToDb = async () => {
    if (loadingPoiDetails) {
      setDbStatusMsg("لطفاً تا پایان دریافت اطلاعات POI صبر کنید.");
      setDbLoading(false);
      return;
    }
    setDbLoading(true);
    setDbTransferErrors([]);
    // استفاده از آخرین state برای poiDetails و poiTokens
    const validRows = filteredResults.map((feature, idx) => {
      const globalIdx = (page - 1) * rowsPerPage + idx;
      const token = poiTokens[globalIdx] || null;
      const props = feature.properties || {};
      const geom = feature.geometry || {};
      const coords = geom.coordinates || [];
      const detail = token ? poiDetails[token] : null;
      // بررسی همه حالت‌های آدرس و trim
      const address =
        (detail?.fields?.find(f => f.icon === "gps")?.value?.trim() || "") ||
        (detail?.address?.trim() || "") ||
        (detail?.location?.trim() || "");
      return {
        token,
        name: detail?.name || props.name || "نامشخص",
        address,
        rate: props.rate ?? "ندارد",
        category: detail?.category || props.category || "-",
        coords: coords.length === 2 ? `[${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}]` : "-"
      };
    });
    const rowsWithAddress = validRows.filter(row => row.address && row.address !== "-");
    const rowsWithoutAddress = validRows.filter(row => !row.address || row.address === "-");
    // انتقال به دیتابیس (Supabase یا mock)
    if (dbType === "supabase" && supabase) {
      try {
        const { error } = await supabase.from('poi_details').upsert(rowsWithAddress, { onConflict: 'token' });
        if (error) {
          setDbStatus("error");
          setDbStatusMsg("خطا در انتقال داده به Supabase: " + error.message);
        } else {
          setDbStatusMsg("انتقال داده‌های دارای آدرس با موفقیت انجام شد!");
        }
      } catch (err) {
        setDbStatus("error");
        setDbStatusMsg("خطا در انتقال داده: " + err.message);
      }
    } else {
      // mock: فقط نمایش داده‌های ذخیره شده
      setDbData(rowsWithAddress);
    }
    setDbTransferErrors(rowsWithoutAddress);
    setDbLoading(false);
  };

  // تابع تست اتصال دیتابیس (mock)
  const handleTestDbConnection = async () => {
    setDbStatus("connecting");
    setDbStatusMsg("");
    // شبیه‌سازی تست اتصال
    setTimeout(() => {
      if (dbConn.trim() !== "") {
        setDbStatus("connected");
        setDbStatusMsg("اتصال موفق به دیتابیس!");
      } else {
        setDbStatus("error");
        setDbStatusMsg("اتصال برقرار نشد. لطفاً اطلاعات اتصال را بررسی کنید.");
      }
    }, 1000);
  };

  // تابع تست اتصال واقعی به Supabase
  const handleTestSupabaseConnection = async () => {
    setDbStatus("connecting");
    setDbStatusMsg("");
    setShowCreateTable(false);
    try {
      if (!supabaseUrl.trim() || !supabaseKey.trim()) {
        setDbStatus("error");
        setDbStatusMsg("لطفاً هر دو مقدار Supabase URL و Key را وارد کنید.");
        return;
      }
      const client = createClient(supabaseUrl, supabaseKey);
      setSupabase(client);
      const { error } = await client.from('poi_details').select('*').limit(1);
      if (error && error.message.includes('Could not find the table')) {
        setDbStatus("error");
        setDbStatusMsg("جدول poi_details وجود ندارد. لطفاً جدول را بسازید.");
        setShowCreateTable(true);
      } else if (error) {
        setDbStatus("error");
        setDbStatusMsg("اتصال برقرار نشد: " + error.message);
      } else {
        setDbStatus("connected");
        setDbStatusMsg("اتصال موفق به Supabase!");
      }
    } catch (err) {
      setDbStatus("error");
      setDbStatusMsg("خطا: " + err.message);
    }
  };

  // تابع ساخت جدول در Supabase
  const handleCreateTable = async () => {
    if (!supabaseUrl || !serviceRoleKey) return;
    setCreatingTable(true);
    try {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const res = await adminClient.rpc('execute_sql', { sql: createTableSQL });
      // اگر تابع execute_sql فعال نبود، به کاربر پیام بده
      if (res.error) {
        setDbStatus("error");
        setDbStatusMsg("ساخت جدول با کلید Service Role ممکن نشد. لطفاً کوئری زیر را در SQL Editor اجرا کنید.");
      } else {
        setDbStatus("connected");
        setDbStatusMsg("جدول ساخته شد و اتصال برقرار است!");
        setShowCreateTable(false);
      }
    } catch (err) {
      setDbStatus("error");
      setDbStatusMsg("خطا در ساخت جدول: " + err.message);
    }
    setCreatingTable(false);
  };

  // سورت جدول داده‌های ذخیره‌شده
  const [dbSortField, setDbSortField] = useState("poitoken");
  const [dbSortDir, setDbSortDir] = useState("asc");
  const handleDbSort = (field) => {
    if (dbSortField === field) {
      setDbSortDir(dbSortDir === "asc" ? "desc" : "asc");
    } else {
      setDbSortField(field);
      setDbSortDir("asc");
    }
  };
  const sortedDbData = [...dbData].sort((a, b) => {
    const vA = (a[dbSortField] || "").toString().toLowerCase();
    const vB = (b[dbSortField] || "").toString().toLowerCase();
    if (vA < vB) return dbSortDir === "asc" ? -1 : 1;
    if (vA > vB) return dbSortDir === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-0 sm:p-8">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 sm:p-10 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
                <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-2">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 17.93V20a1 1 0 1 1-2 0v-.07A8.001 8.001 0 0 1 4.07 13H4a1 1 0 1 1 0-2h.07A8.001 8.001 0 0 1 11 4.07V4a1 1 0 1 1 2 0v.07A8.001 8.001 0 0 1 19.93 11H20a1 1 0 1 1 0 2h-.07A8.001 8.001 0 0 1 13 19.93Z"/></svg>
                </span>
                جستجوی هوشمند راه (Raah)
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base max-w-xl">
                با انتخاب دسته‌بندی و محدوده جغرافیایی، نقاط مورد نظر خود را روی نقشه جستجو و اطلاعات کامل آن‌ها را مشاهده کنید.
              </p>
            </div>
            <div className="flex gap-2">
              <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow transition">
                <span>صفحه اصلی</span>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M10 17l5-5-5-5v10z"/></svg>
              </a>
            </div>
          </div>

          {/* انتخاب دسته‌بندی */}
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-2 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
              <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 17.93V20a1 1 0 1 1-2 0v-.07A8.001 8.001 0 0 1 4.07 13H4a1 1 0 1 1 0-2h.07A8.001 8.001 0 0 1 11 4.07V4a1 1 0 1 1 2 0v.07A8.001 8.001 0 0 1 19.93 11H20a1 1 0 1 1 0 2h-.07A8.001 8.001 0 0 1 13 19.93Z"/></svg>
              </span>
              1. انتخاب دسته‌بندی
            </h2>
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

          {/* نقشه و رسم محدوده */}
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-2 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
              <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 17.93V20a1 1 0 1 1-2 0v-.07A8.001 8.001 0 0 1 4.07 13H4a1 1 0 1 1 0-2h.07A8.001 8.001 0 0 1 11 4.07V4a1 1 0 1 1 2 0v.07A8.001 8.001 0 0 1 19.93 11H20a1 1 0 1 1 0 2h-.07A8.001 8.001 0 0 1 13 19.93Z"/></svg>
              </span>
              2. تعریف محدوده جستجو (روی نقشه)
            </h2>
            <p className="mb-2 text-gray-500 dark:text-gray-400">برای تعریف محدوده جستجو، یک چندضلعی روی نقشه رسم کنید.</p>
            <div className="h-[400px] w-full rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-700 shadow mb-2">
              <MapWithDraw onPolygonChange={setPolygon} />
            </div>
            {polygon && (
              <div className="mt-2 text-xs text-gray-700 dark:text-gray-200 bg-indigo-50 dark:bg-indigo-900 rounded p-2">
                مختصات چندضلعی انتخاب شده:
                <pre className="bg-transparent p-0 mt-1 overflow-x-auto">{JSON.stringify(polygon, null, 2)}</pre>
              </div>
            )}
          </section>

          {/* تولید نقاط جستجو */}
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-2 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
              <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 17.93V20a1 1 0 1 1-2 0v-.07A8.001 8.001 0 0 1 4.07 13H4a1 1 0 1 1 0-2h.07A8.001 8.001 0 0 1 11 4.07V4a1 1 0 1 1 2 0v.07A8.001 8.001 0 0 1 19.93 11H20a1 1 0 1 1 0 2h-.07A8.001 8.001 0 0 1 13 19.93Z"/></svg>
              </span>
              3. اجرای جستجوی چندنقطه‌ای
            </h2>
            <div className="flex flex-wrap gap-2 mb-2 items-center">
              <label className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900 px-2 py-1 rounded-full text-xs">
                گام محیط:
                <input type="number" step="0.0001" min="0.00005" max="0.01" value={step} onChange={e => setStep(Number(e.target.value))} className="w-20 p-1 border rounded" />
              </label>
              <label className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900 px-2 py-1 rounded-full text-xs">
                فاصله داخلی:
                <input type="number" step="0.0001" min="0" max="0.01" value={internalSpacing} onChange={e => setInternalSpacing(Number(e.target.value))} className="w-20 p-1 border rounded" />
              </label>
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-full shadow transition disabled:opacity-50"
                onClick={handleGenerateCameras}
                disabled={!polygon}
              >
                تولید نقاط جستجو
              </button>
              {cameraPoints.length > 0 && (
                <span className="text-green-700 text-xs ml-2">تعداد نقاط جستجو: <b>{cameraPoints.length}</b></span>
              )}
            </div>
          </section>

          {/* اجرای جستجو */}
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-2 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
              <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 17.93V20a1 1 0 1 1-2 0v-.07A8.001 8.001 0 0 1 4.07 13H4a1 1 0 1 1 0-2h.07A8.001 8.001 0 0 1 11 4.07V4a1 1 0 1 1 2 0v.07A8.001 8.001 0 0 1 19.93 11H20a1 1 0 1 1 0 2h-.07A8.001 8.001 0 0 1 13 19.93Z"/></svg>
              </span>
              4. اجرای جستجو
            </h2>
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-full shadow transition disabled:opacity-50"
              onClick={handleSearch}
              disabled={!selected || !polygon || cameraPoints.length === 0 || searching}
            >
              {searching ? (
                <span className="flex items-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>در حال جستجو...</span>
              ) : "اجرای جستجو"}
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

          {/* جدول نتایج و نقشه */}
          {results.length > 0 && !searching && (
            <section className="mb-8">
              <h2 className="text-lg font-bold mb-2 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 17.93V20a1 1 0 1 1-2 0v-.07A8.001 8.001 0 0 1 4.07 13H4a1 1 0 1 1 0-2h.07A8.001 8.001 0 0 1 11 4.07V4a1 1 0 1 1 2 0v.07A8.001 8.001 0 0 1 19.93 11H20a1 1 0 1 1 0 2h-.07A8.001 8.001 0 0 1 13 19.93Z"/></svg>
                </span>
                5. نمایش نتایج
              </h2>
              <div className="flex justify-end mb-2">
                <button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-full shadow transition disabled:opacity-50"
                  onClick={retryAllFailed}
                  disabled={pagedResults.every((feature, idx) => {
                    const globalIdx = (page - 1) * rowsPerPage + idx;
                    const token = poiTokens[globalIdx] || null;
                    return !token || !poiDetailErrors[token];
                  })}
                >
                  فراخوانی مجدد همه آدرس‌های دریافت‌نشده
                </button>
              </div>
              <ResultMap polygon={polygon} results={results} cameraPointsWithStatus={cameraPointsWithStatus} />
              <div className="mt-4 overflow-x-auto">
                <h3 className="font-semibold mb-2">جدول نتایج:</h3>
                {/* Filter Bar */}
                <div className="flex flex-wrap gap-2 mb-2 items-center">
                  <input
                    type="text"
                    className="p-2 border rounded-full min-w-[180px] bg-indigo-50 dark:bg-indigo-900"
                    placeholder="فیلتر بر اساس نام..."
                    value={filterName}
                    onChange={e => setFilterName(e.target.value)}
                  />
                  <input
                    type="text"
                    className="p-2 border rounded-full min-w-[180px] bg-indigo-50 dark:bg-indigo-900"
                    placeholder="فیلتر بر اساس دسته‌بندی..."
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                  />
                  <span className="text-xs text-gray-500 ml-2">({filteredResults.length} نتیجه نمایش داده می‌شود)</span>
                </div>
                <table className="min-w-full border text-sm rounded-xl overflow-hidden shadow-xl">
                  <thead>
                    <tr className="bg-indigo-100 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100">
                      <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("#")}>#</th>
                      <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("نام")}>نام {sortField==="نام" && (sortDir==="asc"?"▲":"▼")}</th>
                      <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("امتیاز")}>امتیاز {sortField==="امتیاز" && (sortDir==="asc"?"▲":"▼")}</th>
                      <th className="border px-2 py-1">آدرس</th>
                      <th className="border px-2 py-1">تلفن</th>
                      <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("دسته‌بندی")}>دسته‌بندی {sortField==="دسته‌بندی" && (sortDir==="asc"?"▲":"▼")}</th>
                      <th className="border px-2 py-1">مختصات</th>
                      <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("poitoken")}>poitoken {sortField==="poitoken" && (sortDir==="asc"?"▲":"▼")}</th>
                      <th className="border px-2 py-1">وضعیت POI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedResults.map((feature, idx) => {
                      const props = feature.properties || {};
                      const geom = feature.geometry || {};
                      const coords = geom.coordinates || [];
                      // پیدا کردن poitoken بر اساس ایندکس کلی feature در کل نتایج
                      const globalIdx = (page - 1) * rowsPerPage + idx;
                      const token = poiTokens[globalIdx] || null;
                      const detail = token ? poiDetails[token] : null;
                      const error = token ? poiDetailErrors[token] : null;
                      return (
                        <tr key={globalIdx} className="odd:bg-white even:bg-indigo-50 dark:odd:bg-gray-900 dark:even:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition">
                          <td className="border px-2 py-1">{globalIdx + 1}</td>
                          <td className="border px-2 py-1">{detail?.name || props.name || "نامشخص"}</td>
                          <td className="border px-2 py-1">{props.rate ?? "ندارد"}</td>
                          <td className="border px-2 py-1">{
                            loadingPoiTokens[token]
                              ? <span className="text-blue-500 animate-pulse">در حال دریافت...</span>
                              : detail?.fields?.find(f => f.icon === "gps")?.value ||
                                detail?.address ||
                                detail?.location ||
                                "-"
                          }</td>
                          <td className="border px-2 py-1">{detail?.fields?.filter(f => f.icon === "phone").map(f => f.text).join(", ") || "-"}</td>
                          <td className="border px-2 py-1">{detail?.category || props.category || "-"}</td>
                          <td className="border px-2 py-1">{coords.length === 2 ? `[${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}]` : "-"}</td>
                          <td className="border px-2 py-1 font-mono text-xs">{token || "-"}</td>
                          <td className="border px-2 py-1 text-xs">
                            {error ? (
                              <span className="flex flex-col gap-1">
                                <span className="text-red-600">{error}</span>
                                {error.startsWith("HTTP 429") && (
                                  <button
                                    className="px-2 py-1 rounded bg-yellow-400 hover:bg-yellow-500 text-xs font-bold text-white transition disabled:opacity-50"
                                    onClick={() => retryFetchPoiDetail(token)}
                                    disabled={retryingToken === token}
                                  >
                                    {retryingToken === token ? "در حال دریافت..." : "دریافت مجدد"}
                                  </button>
                                )}
                              </span>
                            ) : detail ? (
                              <span className="text-green-700">دریافت شد</span>
                            ) : (
                              <span className="text-gray-400">در انتظار</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Pagination */}
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    className="px-3 py-1 rounded-full border bg-indigo-100 dark:bg-indigo-800 hover:bg-indigo-200 dark:hover:bg-indigo-700 text-indigo-700 dark:text-indigo-200 font-bold disabled:opacity-50"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    قبلی
                  </button>
                  <span className="mx-2">صفحه {page} از {pageCount}</span>
                  <button
                    className="px-3 py-1 rounded-full border bg-indigo-100 dark:bg-indigo-800 hover:bg-indigo-200 dark:hover:bg-indigo-700 text-indigo-700 dark:text-indigo-200 font-bold disabled:opacity-50"
                    onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                    disabled={page === pageCount}
                  >
                    بعدی
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
        {/* --- بخش تنظیمات دیتابیس --- */}
        <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 sm:p-10 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 17.93V20a1 1 0 1 1-2 0v-.07A8.001 8.001 0 0 1 4.07 13H4a1 1 0 1 1 0-2h.07A8.001 8.001 0 0 1 11 4.07V4a1 1 0 1 1 2 0v.07A8.001 8.001 0 0 1 19.93 11H20a1 1 0 1 1 0 2h-.07A8.001 8.001 0 0 1 13 19.93Z"/></svg>
            </span>
            تنظیمات دیتابیس
          </h2>
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <label className="flex items-center gap-2">
              نوع دیتابیس:
              <select className="p-2 border rounded" value={dbType} onChange={e => setDbType(e.target.value)}>
                <option value="sqlite">SQLite</option>
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="supabase">Supabase</option>
              </select>
            </label>
            {dbType === "supabase" && (
              <>
                <input
                  type="text"
                  className="p-2 border rounded min-w-[200px]"
                  placeholder="Supabase URL"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                />
                <input
                  type="text"
                  className="p-2 border rounded min-w-[200px]"
                  placeholder="Supabase API Key"
                  value={supabaseKey}
                  onChange={e => setSupabaseKey(e.target.value)}
                />
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full shadow transition"
                  onClick={handleTestSupabaseConnection}
                  disabled={dbStatus === "connecting"}
                >
                  {dbStatus === "connecting" ? "در حال اتصال..." : "تست اتصال"}
                </button>
              </>
            )}
            {dbType !== "supabase" && (
              <input
                type="text"
                className="p-2 border rounded min-w-[200px]"
                placeholder="Connection string یا مسیر فایل..."
                value={dbConn}
                onChange={e => setDbConn(e.target.value)}
              />
            )}
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow transition disabled:opacity-50"
              onClick={handleTransferToDb}
              disabled={dbLoading || dbStatus !== "connected"}
            >
              {dbLoading ? "در حال انتقال..." : "انتقال داده به دیتابیس"}
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full shadow transition"
              onClick={() => setDbData([])}
            >
              پاک‌سازی نمایش داده‌های ذخیره‌شده
            </button>
            {showCreateTable && dbType === "supabase" && (
              <div className="w-full bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded p-4 mt-2">
                <div className="mb-2 text-yellow-800 dark:text-yellow-200 font-bold">جدول poi_details در Supabase وجود ندارد.</div>
                <div className="mb-2 text-sm">برای ساخت جدول، کوئری زیر را در SQL Editor اجرا کنید یا اگر Service Role Key دارید، آن را وارد و روی دکمه زیر کلیک کنید:</div>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto mb-2">{createTableSQL}</pre>
                <input
                  type="text"
                  className="p-2 border rounded min-w-[200px] mb-2"
                  placeholder="Supabase Service Role Key (اختیاری)"
                  value={serviceRoleKey}
                  onChange={e => setServiceRoleKey(e.target.value)}
                />
                <button
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-full shadow transition disabled:opacity-50"
                  onClick={handleCreateTable}
                  disabled={creatingTable || !serviceRoleKey}
                >
                  {creatingTable ? "در حال ساخت جدول..." : "ساخت جدول در Supabase"}
                </button>
              </div>
            )}
            {/* وضعیت اتصال */}
            <span className={
              dbStatus === "connected" ? "text-green-700 font-bold" :
              dbStatus === "connecting" ? "text-blue-600" :
              dbStatus === "error" ? "text-red-600 font-bold" : "text-gray-500"
            }>
              {dbStatusMsg}
            </span>
          </div>
          {dbData.length > 0 && (
            <div className="overflow-x-auto mt-2">
              <h3 className="font-semibold mb-2">داده‌های ذخیره‌شده در دیتابیس (نمونه):</h3>
              <div className="mb-2 text-sm text-green-700 dark:text-green-300">تعداد اطلاعات ذخیره‌شده: <b>{dbData.length}</b></div>
              <table className="min-w-full border text-sm rounded-xl overflow-hidden shadow-xl">
                <thead>
                  <tr className="bg-indigo-100 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100">
                    <th className="border px-2 py-1 cursor-pointer" onClick={() => handleDbSort("poitoken")}>poitoken {dbSortField==="poitoken" && (dbSortDir==="asc"?"▲":"▼")}</th>
                    <th className="border px-2 py-1 cursor-pointer" onClick={() => handleDbSort("name")}>نام {dbSortField==="name" && (dbSortDir==="asc"?"▲":"▼")}</th>
                    <th className="border px-2 py-1 cursor-pointer" onClick={() => handleDbSort("address")}>آدرس {dbSortField==="address" && (dbSortDir==="asc"?"▲":"▼")}</th>
                    <th className="border px-2 py-1 cursor-pointer" onClick={() => handleDbSort("rate")}>امتیاز {dbSortField==="rate" && (dbSortDir==="asc"?"▲":"▼")}</th>
                    <th className="border px-2 py-1 cursor-pointer" onClick={() => handleDbSort("category")}>دسته‌بندی {dbSortField==="category" && (dbSortDir==="asc"?"▲":"▼")}</th>
                    <th className="border px-2 py-1 cursor-pointer" onClick={() => handleDbSort("coords")}>مختصات {dbSortField==="coords" && (dbSortDir==="asc"?"▲":"▼")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDbData.map((row, idx) => (
                    <tr key={idx} className="odd:bg-white even:bg-indigo-50 dark:odd:bg-gray-900 dark:even:bg-indigo-900/40">
                      <td className="border px-2 py-1 font-mono text-xs">{row.token}</td>
                      <td className="border px-2 py-1">{row.name}</td>
                      <td className="border px-2 py-1">{row.address}</td>
                      <td className="border px-2 py-1">{row.rate}</td>
                      <td className="border px-2 py-1">{row.category}</td>
                      <td className="border px-2 py-1">{row.coords}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {dbTransferErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded p-4 mt-2">
              <div className="mb-2 text-red-800 dark:text-red-200 font-bold">برخی ردیف‌ها به دلیل نداشتن آدرس ارسال نشدند:</div>
              <ul className="text-xs text-red-700 dark:text-red-300 list-disc pl-5">
                {dbTransferErrors.map((row, idx) => (
                  <li key={idx}>{row.token} - {row.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
