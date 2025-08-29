"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cities } from "./cities-data";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCities, setFilteredCities] = useState([]);
  const [showCityList, setShowCityList] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);

  // فیلتر شهرها بر اساس جستجو
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCities([]);
    } else {
      const filtered = cities.filter(city =>
        city.name_fa.includes(searchQuery) ||
        city.name_en.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10); // فقط 10 شهر اول
      setFilteredCities(filtered);
    }
  }, [searchQuery]);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSearchQuery(city.name_fa);
    setShowCityList(false);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowCityList(true);
    setSelectedCity(null);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim() !== "") {
      setShowCityList(true);
    }
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowCityList(false), 200);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCity(null);
    setFilteredCities([]);
    setShowCityList(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-0 sm:p-8">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 sm:p-10 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <img src="/iran-map-logo.svg" alt="لوگوی نقشه ایران" className="w-16 h-16" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-4">
              نقشه هوشمند ایران
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              ابزارهای پیشرفته برای جستجو و تحلیل جغرافیایی
            </p>
          </div>

          {/* City Search Section */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                جستجوی سریع شهر
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                نام شهر مورد نظر خود را وارد کنید
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="نام شهر را وارد کنید (فارسی یا انگلیسی)..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className="w-full p-4 pr-12 pl-12 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl text-lg focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </div>
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  )}
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
                <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/50 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{selectedCity.name_fa}</h3>
                      <p className="text-indigo-700 dark:text-indigo-300">{selectedCity.name_en}</p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">
                        مختصات: {selectedCity.coordinates[1].toFixed(4)}, {selectedCity.coordinates[0].toFixed(4)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link 
                        href={`/city-search?city=${encodeURIComponent(selectedCity.name_fa)}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        نقشه
                      </Link>
                      <Link 
                        href={`/smart-search-with-city?city=${encodeURIComponent(selectedCity.name_fa)}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        جستجو
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/city-search" className="group">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">جستجوی شهرها و محله‌ها</h3>
                    <p className="text-blue-100">نقشه تعاملی شهرهای ایران با انتخاب محله</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-blue-100 group-hover:text-white transition-colors">
                  <span>شروع کنید</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="mr-2 transform group-hover:translate-x-1 transition-transform">
                    <path fill="currentColor" d="M10 17l5-5-5-5v10z"/>
                  </svg>
                </div>
              </div>
            </Link>

            <Link href="/smart-search" className="group">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">جستجوی هوشمند راه</h3>
                    <p className="text-green-100">جستجوی پیشرفته با نقشه و دسته‌بندی</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-green-100 group-hover:text-white transition-colors">
                  <span>شروع کنید</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="mr-2 transform group-hover:translate-x-1 transition-transform">
                    <path fill="currentColor" d="M10 17l5-5-5-5v10z"/>
                  </svg>
                </div>
              </div>
            </Link>

            <Link href="/smart-search-with-city" className="group">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">جستجوی هوشمند با نام شهر</h3>
                    <p className="text-purple-100">
                      صنف یاب شهری
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-purple-100 group-hover:text-white transition-colors">
                  <span>شروع کنید</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="mr-2 transform group-hover:translate-x-1 transition-transform">
                    <path fill="currentColor" d="M10 17l5-5-5-5v10z"/>
                  </svg>
                </div>
              </div>
            </Link>

            <Link href="/city-management" className="group">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">مدیریت شهرها</h3>
                    <p className="text-orange-100">
                      اضافه و ویرایش شهرهای ایران
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-orange-100 group-hover:text-white transition-colors">
                  <span>شروع کنید</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="mr-2 transform group-hover:translate-x-1 transition-transform">
                    <path fill="currentColor" d="M10 17l5-5-5-5v10z"/>
                  </svg>
                </div>
              </div>
            </Link>

            <Link href="/neighborhood-extraction" className="group">
              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">استخراج محلات</h3>
                    <p className="text-teal-100">
                      استخراج محلات از شهرها با API
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-teal-100 group-hover:text-white transition-colors">
                  <span>شروع کنید</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="mr-2 transform group-hover:translate-x-1 transition-transform">
                    <path fill="currentColor" d="M10 17l5-5-5-5v10z"/>
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              این پروژه جنبه آموزشی دارد و استفاده به صورت تجاری پیگرد قانونی دارد.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
