"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cities } from "../cities-data";

export default function CityManagementPage() {
  const [cityList, setCityList] = useState([]);
  const [newCity, setNewCity] = useState({
    name_fa: "",
    name_en: "",
    coordinates: ["", ""]
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCities, setFilteredCities] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Load cities on component mount
  useEffect(() => {
    // Try to load from localStorage first, then fallback to cities-data.js
    const savedCities = localStorage.getItem('iranCities');
    if (savedCities) {
      try {
        const parsedCities = JSON.parse(savedCities);
        setCityList(parsedCities);
        setFilteredCities(parsedCities);
      } catch (error) {
        console.error('Error parsing saved cities:', error);
        setCityList(cities);
        setFilteredCities(cities);
      }
    } else {
      setCityList(cities);
      setFilteredCities(cities);
    }
  }, []);

  // Filter cities based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCities(cityList);
    } else {
      const filtered = cityList.filter(city =>
        city.name_fa.includes(searchQuery) ||
        city.name_en.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [searchQuery, cityList]);

  const handleInputChange = (field, value) => {
    if (field === "coordinates") {
      setNewCity(prev => ({
        ...prev,
        coordinates: value.split(",").map(coord => coord.trim())
      }));
    } else {
      setNewCity(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateCoordinates = (coordinates) => {
    if (coordinates.length !== 2) return false;
    const [lng, lat] = coordinates;
    const lngNum = parseFloat(lng);
    const latNum = parseFloat(lat);
    return !isNaN(lngNum) && !isNaN(latNum) && 
           lngNum >= 44 && lngNum <= 64 && // Longitude range for Iran
           latNum >= 25 && latNum <= 40;   // Latitude range for Iran
  };

  const addCity = () => {
    if (!newCity.name_fa.trim() || !newCity.name_en.trim()) {
      alert("لطفاً نام شهر را به فارسی و انگلیسی وارد کنید");
      return;
    }

    if (!validateCoordinates(newCity.coordinates)) {
      alert("لطفاً مختصات جغرافیایی معتبر وارد کنید (طول جغرافیایی: 44-64، عرض جغرافیایی: 25-40)");
      return;
    }

    // Check for duplicates
    const isDuplicate = cityList.some(city => 
      city.name_fa === newCity.name_fa || city.name_en.toLowerCase() === newCity.name_en.toLowerCase()
    );

    if (isDuplicate) {
      alert("این شهر قبلاً در لیست وجود دارد");
      return;
    }

    const cityToAdd = {
      name_fa: newCity.name_fa.trim(),
      name_en: newCity.name_en.trim(),
      coordinates: newCity.coordinates.map(coord => parseFloat(coord))
    };

    const updatedCities = [...cityList, cityToAdd];
    setCityList(updatedCities);
    
    // Save to localStorage
    localStorage.setItem('iranCities', JSON.stringify(updatedCities));
    
    // Reset form
    setNewCity({
      name_fa: "",
      name_en: "",
      coordinates: ["", ""]
    });
    setShowAddForm(false);

    // Generate export code
    generateExportCode(updatedCities);
  };

  const editCity = (index) => {
    const city = cityList[index];
    setNewCity({
      name_fa: city.name_fa,
      name_en: city.name_en,
      coordinates: city.coordinates.map(coord => coord.toString())
    });
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const updateCity = () => {
    if (!newCity.name_fa.trim() || !newCity.name_en.trim()) {
      alert("لطفاً نام شهر را به فارسی و انگلیسی وارد کنید");
      return;
    }

    if (!validateCoordinates(newCity.coordinates)) {
      alert("لطفاً مختصات جغرافیایی معتبر وارد کنید");
      return;
    }

    const updatedCities = [...cityList];
    updatedCities[editingIndex] = {
      name_fa: newCity.name_fa.trim(),
      name_en: newCity.name_en.trim(),
      coordinates: newCity.coordinates.map(coord => parseFloat(coord))
    };

    setCityList(updatedCities);
    
    // Save to localStorage
    localStorage.setItem('iranCities', JSON.stringify(updatedCities));
    
    // Reset form
    setNewCity({
      name_fa: "",
      name_en: "",
      coordinates: ["", ""]
    });
    setEditingIndex(-1);
    setShowAddForm(false);

    // Generate export code
    generateExportCode(updatedCities);
  };

  const deleteCity = (index) => {
    if (confirm("آیا مطمئن هستید که می‌خواهید این شهر را حذف کنید؟")) {
      const updatedCities = cityList.filter((_, i) => i !== index);
      setCityList(updatedCities);
      
      // Save to localStorage
      localStorage.setItem('iranCities', JSON.stringify(updatedCities));
      
      generateExportCode(updatedCities);
    }
  };

  const generateExportCode = (cities) => {
    const exportCode = `export const cities = [
${cities.map(city => `  {"name_fa": "${city.name_fa}", "name_en": "${city.name_en}", "coordinates": [${city.coordinates[0]}, ${city.coordinates[1]}]}`).join(',\n')}
];`;
    
    // Create downloadable file
    const blob = new Blob([exportCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cities-data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success message
    alert(`فایل cities-data.js با ${cities.length} شهر دانلود شد. لطفاً این فایل را جایگزین فایل src/app/cities-data.js کنید.`);
  };

  const exportCities = () => {
    generateExportCode(cityList);
  };

  const resetToOriginal = () => {
    if (confirm("آیا مطمئن هستید که می‌خواهید به لیست اصلی شهرها برگردید؟ تمام تغییرات از بین خواهد رفت.")) {
      localStorage.removeItem('iranCities');
      setCityList(cities);
      setFilteredCities(cities);
      alert("لیست شهرها به حالت اصلی برگشت.");
    }
  };

  const clearAllCities = () => {
    if (confirm("آیا مطمئن هستید که می‌خواهید تمام شهرها را حذف کنید؟")) {
      localStorage.removeItem('iranCities');
      setCityList([]);
      setFilteredCities([]);
      alert("تمام شهرها حذف شدند.");
    }
  };

  const cancelEdit = () => {
    setNewCity({
      name_fa: "",
      name_en: "",
      coordinates: ["", ""]
    });
    setEditingIndex(-1);
    setShowAddForm(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-0 sm:p-8">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 sm:p-10 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
                <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-2">
                  <img src="/iran-map-logo-small.svg" alt="لوگوی نقشه ایران" className="w-8 h-8" />
                </span>
                مدیریت شهرها
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base max-w-xl">
                اضافه، ویرایش و حذف شهرهای ایران در فایل cities-data.js
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow transition">
                <span>صفحه اصلی</span>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M10 17l5-5-5-5v10z"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="جستجوی شهر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pr-10 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow transition-colors"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              افزودن شهر جدید
            </button>
            <button
              onClick={exportCities}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
              </svg>
              دانلود فایل cities-data.js
            </button>
            <button
              onClick={resetToOriginal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg shadow transition-colors"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              بازگشت به لیست اصلی
            </button>
            <button
              onClick={clearAllCities}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow transition-colors"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              حذف تمام شهرها
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                {editingIndex >= 0 ? "ویرایش شهر" : "افزودن شهر جدید"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام شهر (فارسی)
                  </label>
                  <input
                    type="text"
                    value={newCity.name_fa}
                    onChange={(e) => handleInputChange("name_fa", e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="مثال: تهران"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام شهر (انگلیسی)
                  </label>
                  <input
                    type="text"
                    value={newCity.name_en}
                    onChange={(e) => handleInputChange("name_en", e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="مثال: Tehran"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مختصات جغرافیایی (طول، عرض)
                  </label>
                  <input
                    type="text"
                    value={newCity.coordinates.join(", ")}
                    onChange={(e) => handleInputChange("coordinates", e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="مثال: 51.3890, 35.6892"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    فرمت: طول جغرافیایی، عرض جغرافیایی (محدوده ایران: طول 44-64، عرض 25-40)
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={editingIndex >= 0 ? updateCity : addCity}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {editingIndex >= 0 ? "بروزرسانی" : "افزودن"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}

          {/* Cities List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-indigo-50 dark:bg-indigo-900/50">
                  <tr>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      نام شهر (فارسی)
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      نام شهر (انگلیسی)
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      مختصات
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCities.map((city, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {city.name_fa}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {city.name_en}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                        {city.coordinates[0].toFixed(4)}, {city.coordinates[1].toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => editCity(index)}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="ویرایش"
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteCity(index)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              تعداد کل شهرها: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{cityList.length}</span>
            </p>
            {searchQuery && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                نتایج جستجو: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{filteredCities.length}</span> شهر
              </p>
            )}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💾 <strong>نکته:</strong> تغییرات در مرورگر شما ذخیره می‌شوند. برای ذخیره دائمی، فایل cities-data.js را دانلود کرده و جایگزین کنید.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
