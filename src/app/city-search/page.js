"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { cities } from "../cities-data";
import Link from "next/link";

// Dynamic import for MapboxMap
const MapboxMap = dynamic(() => import("../smart-search/MapboxMap"), { 
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="loading-spinner inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
        <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری نقشه...</p>
      </div>
    </div>
  )
});

export default function CitySearchPage() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCities, setFilteredCities] = useState(cities);
  const [showCityList, setShowCityList] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [neighborhoodError, setNeighborhoodError] = useState("");

  // Filter cities based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCities(cities);
    } else {
      const filtered = cities.filter(city => 
        city.name_fa.includes(searchQuery) || 
        city.name_en.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [searchQuery]);

  // Fetch neighborhoods when city is selected
  useEffect(() => {
    if (selectedCity) {
      fetchNeighborhoods(selectedCity.name_en.toLowerCase());
    } else {
      setNeighborhoods([]);
      setSelectedNeighborhood(null);
    }
  }, [selectedCity]);

  const fetchNeighborhoods = async (cityName) => {
    setLoadingNeighborhoods(true);
    setNeighborhoodError("");
    try {
      // First get city info to extract neighborhoods
      const cityResponse = await fetch(`https://search.raah.ir/v4/region-card/${cityName}/`);
      if (!cityResponse.ok) throw new Error("خطا در دریافت اطلاعات شهر");
      
      const cityData = await cityResponse.json();
      
      // Extract neighborhoods from city description data
      const cityNeighborhoods = cityData.description?.data
        ?.filter(item => item.page === "region" && item.slug.neighborhood)
        ?.map(item => ({
          name: item.text,
          slug: item.slug.neighborhood,
          city: item.slug.city
        })) || [];

      setNeighborhoods(cityNeighborhoods);
      
      // Reset selected neighborhood when city changes
      setSelectedNeighborhood(null);
      
    } catch (error) {
      console.error("Error fetching neighborhoods:", error);
      setNeighborhoodError("خطا در دریافت محله‌ها: " + error.message);
      setNeighborhoods([]);
    } finally {
      setLoadingNeighborhoods(false);
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSearchQuery(city.name_fa);
    setShowCityList(false);
  };

  const handleNeighborhoodSelect = async (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    
    // Fetch detailed neighborhood info including coordinates
    try {
      const response = await fetch(`https://search.raah.ir/v5/region-card/${neighborhood.city}/${neighborhood.slug}/`);
      if (response.ok) {
        const data = await response.json();
        // Update neighborhood with full data
        setSelectedNeighborhood({
          ...neighborhood,
          fullData: data,
          coordinates: data.geometry?.coordinates,
          centerPoint: data.center_point
        });
      }
    } catch (error) {
      console.error("Error fetching neighborhood details:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowCityList(true);
  };

  const handleSearchFocus = () => {
    setShowCityList(true);
  };

  const handleSearchBlur = () => {
    // Delay hiding the list to allow clicking on items
    setTimeout(() => setShowCityList(false), 200);
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
                جستجوی شهرها و محله‌های ایران
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base max-w-xl">
                نقشه تعاملی شهرهای ایران با قابلیت انتخاب محله و نمایش محدوده جغرافیایی
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow transition">
                <span>صفحه اصلی</span>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M10 17l5-5-5-5v10z"/>
                </svg>
              </Link>
              <Link href="/smart-search" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow transition">
                <span>جستجوی هوشمند</span>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M10 17l5-5-5-5v10z"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="جستجوی شهر (فارسی یا انگلیسی)..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="w-full p-4 pr-12 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl text-lg focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
            </div>

            {/* City List Dropdown */}
            {showCityList && filteredCities.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl mt-2 max-h-60 overflow-y-auto shadow-xl">
                {filteredCities.map((city, index) => (
                  <div
                    key={index}
                    onClick={() => handleCitySelect(city)}
                    className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{city.name_fa}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{city.name_en}</div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {city.coordinates[1].toFixed(4)}, {city.coordinates[0].toFixed(4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected City Info */}
          {selectedCity && (
            <div className="bg-indigo-50 dark:bg-indigo-900/50 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">{selectedCity.name_fa}</h3>
                  <p className="text-indigo-700 dark:text-indigo-300">{selectedCity.name_en}</p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">
                    مختصات: {selectedCity.coordinates[1].toFixed(4)}, {selectedCity.coordinates[0].toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Neighborhood Selection */}
          {selectedCity && (
            <div className="bg-green-50 dark:bg-green-900/50 rounded-xl p-4 border border-green-200 dark:border-green-700">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                <span className="inline-block bg-green-100 dark:bg-green-900 rounded-full p-1">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </span>
                انتخاب محله
              </h3>
              
              {loadingNeighborhoods ? (
                <div className="text-center py-4">
                  <div className="loading-spinner inline-block w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full mb-2"></div>
                  <p className="text-green-600 dark:text-green-400">در حال دریافت محله‌ها...</p>
                </div>
              ) : neighborhoodError ? (
                <div className="text-red-600 dark:text-red-400 text-center py-2">{neighborhoodError}</div>
              ) : neighborhoods.length > 0 ? (
                <div>
                  <p className="text-green-700 dark:text-green-300 mb-3">
                    {neighborhoods.length} محله در شهر {selectedCity.name_fa} یافت شد:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {neighborhoods.map((neighborhood, index) => (
                      <div
                        key={index}
                        onClick={() => handleNeighborhoodSelect(neighborhood)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md text-center ${
                          selectedNeighborhood && selectedNeighborhood.slug === neighborhood.slug
                            ? 'border-green-500 bg-green-100 dark:bg-green-800/50'
                            : 'border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500'
                        }`}
                      >
                        <div className="font-medium text-green-900 dark:text-green-100 text-sm">
                          {neighborhood.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-green-600 dark:text-green-400 text-center py-2">
                  محله‌ای برای این شهر یافت نشد.
                </p>
              )}
            </div>
          )}

          {/* Selected Neighborhood Info */}
          {selectedNeighborhood && (
            <div className="bg-green-50 dark:bg-green-900/50 rounded-xl p-4 border border-green-200 dark:border-green-700 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-green-900 dark:text-green-100">
                    محله {selectedNeighborhood.name}
                  </h4>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    شهر {selectedCity?.name_fa}
                  </p>
                  {selectedNeighborhood.centerPoint && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      مرکز: {selectedNeighborhood.centerPoint[0].toFixed(4)}, {selectedNeighborhood.centerPoint[1].toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Section */}
        <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 sm:p-10 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </span>
            نقشه شهرها و محله‌ها
          </h2>
          <div className="h-[600px] w-full rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-700 shadow">
            <MapboxMap 
              selectedCity={selectedCity} 
              selectedNeighborhood={selectedNeighborhood}
              onCitySelect={handleCitySelect} 
            />
          </div>
        </div>

        {/* Cities List */}
        <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 sm:p-10 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </span>
            لیست تمام شهرها
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cities.map((city, index) => (
              <div
                key={index}
                onClick={() => handleCitySelect(city)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedCity && selectedCity.name_fa === city.name_fa
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
              >
                <div className="text-center">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{city.name_fa}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{city.name_en}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {city.coordinates[1].toFixed(4)}, {city.coordinates[0].toFixed(4)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
