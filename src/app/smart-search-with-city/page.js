"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { cities } from "../cities-data";
import Link from "next/link";
import CategoryCombobox from "../smart-search/CategoryCombobox";
import * as XLSX from 'xlsx';

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

export default function SmartSearchWithCityPage() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCities, setFilteredCities] = useState(cities);
  const [showCityList, setShowCityList] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [detailedResults, setDetailedResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [itemsPerPage] = useState(10);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchStatus, setSearchStatus] = useState("");
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  // Ref برای مدیریت درخواست‌های قابل لغو
  const abortControllerRef = useRef(null);

  // تابع شمارش معکوس
  const startCountdown = (seconds) => {
    // پاک کردن تایمر قبلی اگر وجود دارد
    if (window.countdownTimer) {
      clearInterval(window.countdownTimer);
    }
    
    setCountdown(seconds);
    setIsCountdownActive(true);
    
    window.countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(window.countdownTimer);
          window.countdownTimer = null;
          setIsCountdownActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return window.countdownTimer;
  };

  // تابع پاک کردن شمارش معکوس
  const clearCountdown = () => {
    if (window.countdownTimer) {
      clearInterval(window.countdownTimer);
      window.countdownTimer = null;
    }
    setIsCountdownActive(false);
    setCountdown(0);
  };

  // Fetch categories from API on component mount
  useEffect(() => {
    fetchCategories();
    
    // Cleanup function to clear countdown timer when component unmounts
    return () => {
      if (window.countdownTimer) {
        clearInterval(window.countdownTimer);
        window.countdownTimer = null;
      }
    };
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch("https://search.raah.ir/v6/bundle-list/full/");
      if (!res.ok) throw new Error(`خطا در دریافت دسته‌بندی‌ها: ${res.status}`);
      const data = await res.json();

      if (data.results && Array.isArray(data.results)) {
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
      } else {
        // فیل‌بک دسته‌بندی‌ها
        setCategories([
          { slug: "restaurant", display: "🍽️ رستوران" },
          { slug: "cafe", display: "☕ کافه" },
          { slug: "shopping-mall", display: "🛍️ مرکز خرید" },
          { slug: "hotel", display: "🏨 هتل" },
          { slug: "hospital", display: "🏥 بیمارستان" },
          { slug: "pharmacy", display: "💊 داروخانه" },
          { slug: "park", display: "🌳 پارک" },
          { slug: "cinema", display: "🎬 سینما" },
          { slug: "bank", display: "🏦 بانک" },
          { slug: "gas-station", display: "⛽ پمپ بنزین" },
          { slug: "confectionery", display: "🍰 شیرینی فروشی" },
          { slug: "bakery", display: "🥖 نانوایی" },
          { slug: "subway-station", display: "🚇 مترو" },
          { slug: "bus-station", display: "🚌 اتوبوس" },
          { slug: "taxi-station", display: "🚕 تاکسی" }
        ]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([
        { slug: "restaurant", display: "🍽️ رستوران" },
        { slug: "cafe", display: "☕ کافه" },
        { slug: "shopping-mall", display: "🛍️ مرکز خرید" },
        { slug: "hotel", display: "🏨 هتل" },
        { slug: "hospital", display: "🏥 بیمارستان" },
        { slug: "pharmacy", display: "💊 داروخانه" },
        { slug: "park", display: "🌳 پارک" },
        { slug: "cinema", display: "🎬 سینما" },
        { slug: "bank", display: "🏦 بانک" },
        { slug: "gas-station", display: "⛽ پمپ بنزین" },
        { slug: "confectionery", display: "🍰 شیرینی فروشی" },
        { slug: "bakery", display: "🥖 نانوایی" },
        { slug: "subway-station", display: "🚇 مترو" },
        { slug: "bus-station", display: "🚌 اتوبوس" },
        { slug: "taxi-station", display: "🚕 تاکسی" }
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // تابع دسته‌بندی خطاها
  const categorizeError = (error) => {
    const message = error.message || error.toString();
    if (message.includes("Not found") || message.includes("404")) return "NOT_FOUND";
    if (message.includes("429") || message.includes("rate limit")) return "RATE_LIMIT";
    if (message.includes("network") || message.includes("fetch")) return "NETWORK_ERROR";
    if (message.includes("timeout")) return "TIMEOUT";
    return "UNKNOWN_ERROR";
  };

  // فیلتر شهرها بر اساس جستجو
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

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSearchQuery(city.name_fa);
    setShowCityList(false);
    setSearchResults([]);
    setDetailedResults([]);
    setCurrentPage(1);
    setTotalPages(1);
    setSelectedCategory("");
    setSearchCompleted(false);
  };

  // تابع جستجو با توقف فوری در صورت خطای 404
  const searchPlaces = async () => {
    if (!selectedCity || !selectedCategory) return;
  
    // لغو درخواست قبلی
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
  
    setLoading(true);
    setError("");
    setSearchResults([]);
    setDetailedResults([]);
    setCurrentPage(1);
    setTotalPages(1);
    setSearchStatus("در حال آماده‌سازی جستجو...");
    setSearchCompleted(false);
  
    let allItems = [];
    let allItemElements = [];
    let currentPageNum = 1;
    let lastSuccessfulPage = 0;
    let encounteredError = false;
    let errorDetails = "";
  
    try {
      const citySlug = selectedCity.name_en.toLowerCase();
      const categorySlug = selectedCategory;
  
      while (currentPageNum <= 1000) {
        console.log(`Starting search for page ${currentPageNum}`);
        const url = `https://search.raah.ir/v4/placeslist/cat/?region=city-${citySlug}&name=${categorySlug}&page=${currentPageNum}`;
        setSearchStatus(`در حال جستجو در صفحه ${currentPageNum}... (${allItems.length} مکان یافت شده)`);
  
        let retryCount = 0;
        let success = false;
  
        while (!success && retryCount < 3) {
          try {
            const response = await fetch(url, {
              signal: AbortSignal.timeout(10000),
            });
  
            // توقف فوری در صورت دریافت خطای 404
            if (response.status === 404) {
              setSearchStatus(`خطای 404: صفحه ${currentPageNum} یافت نشد - توقف جستجو`);
              lastSuccessfulPage = currentPageNum - 1;
              encounteredError = true;
              errorDetails = "NOT_FOUND";
              break;
            }
  
            if (response.status === 429) {
              setSearchStatus(`محدودیت درخواست (صفحه ${currentPageNum}) - انتظار 5 ثانیه...`);
              startCountdown(5);
              await new Promise(resolve => setTimeout(resolve, 5000));
              clearCountdown();
              retryCount++;
              continue;
            }
  
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
            const data = await response.json();
  
            // شرط توقف: بررسی وجود "detail" یا آیتم‌های خالی
            if (data.detail || !data.items || data.items.length === 0) {
              setSearchStatus(
                data.detail
                  ? `صفحه ${currentPageNum} یافت نشد (${data.detail}) - توقف جستجو`
                  : `صفحه ${currentPageNum} خالی است - توقف جستجو`
              );
              lastSuccessfulPage = currentPageNum - 1;
              success = true;
              break;
            }
  
            // اگر داده‌های معتبر دریافت شد
            if (data.slug && data.items && Array.isArray(data.items) && data.items.length > 0) {
              console.log(`Page ${currentPageNum} successful: ${data.items.length} items found`);
              allItems = allItems.concat(data.items);
              allItemElements = allItemElements.concat(data.item_element_list);
              lastSuccessfulPage = currentPageNum;
              success = true;

              // دریافت اطلاعات جزئی برای مکان‌های این صفحه
              setSearchStatus(`در حال دریافت جزئیات مکان‌های صفحه ${currentPageNum}...`);
              await fetchDetailedResultsForPage(data.items, allItems.length - data.items.length);

              await new Promise(resolve => setTimeout(resolve, 300));
              currentPageNum++;
              console.log(`Moving to page ${currentPageNum}`);
            } else {
              setSearchStatus(`داده‌های نامعتبر در صفحه ${currentPageNum} - توقف جستجو`);
              lastSuccessfulPage = currentPageNum - 1;
              success = true;
              break;
            }
          } catch (error) {
            if (error.name === "AbortError") break;
  
            const errorType = categorizeError(error);
            retryCount++;
  
            if (retryCount >= 3) {
              encounteredError = true;
              errorDetails = `صفحه ${currentPageNum}: ${errorType}`;
              console.warn(`صفحه ${currentPageNum} با خطا مواجه شد پس از 3 تلاش:`, error);
              break;
            }
  
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
  
        // اگر خطا رخ داده یا جستجو کامل شده، حلقه را متوقف کن
        if (encounteredError) {
          console.log(`Breaking loop due to error: ${errorDetails}`);
          break;
        }
        
        console.log(`Loop iteration ${currentPageNum} completed, continuing...`);
      }
  
      // نمایش نتایج
      if (allItems.length > 0) {
        setSearchResults(allItemElements);
        setTotalPages(lastSuccessfulPage);
        setCurrentPage(1);
  
        if (encounteredError) {
          setSearchStatus(`⚠️ جستجو تا صفحه ${lastSuccessfulPage} با موفقیت انجام شد، اما دریافت صفحه بعدی با خطا مواجه شد: ${errorDetails}`);
        } else {
          setSearchStatus(`✅ جستجو کامل شد. ${allItems.length} مکان در ${lastSuccessfulPage} صفحه یافت شد.`);
        }
      } else {
        setSearchStatus("هیچ مکانی یافت نشد.");
        setError("نتیجه‌ای یافت نشد — ممکن است دسته‌بندی یا شهر اشتباه باشد.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("خطای غیرمنتظره:", err);
        setSearchStatus(`⚠️ جستجو تا صفحه ${lastSuccessfulPage} انجام شد، اما با خطا مواجه شد.`);
        setError(`خطا: ${err.message}`);
      }
  
      if (allItems.length > 0) {
        setSearchResults(allItemElements);
        setTotalPages(lastSuccessfulPage);
      }
    } finally {
      setLoading(false);
      setSearchCompleted(true);
    }
  };

  const fetchDetailedResultsForPage = async (items, startIndex) => {
    if (!items || items.length === 0) return;
    setLoadingDetails(true);
    const detailed = [];
    try {
      for (let i = 0; i < items.length; i++) {
        const token = items[i];
        setSearchStatus(`در حال دریافت جزئیات مکان ${startIndex + i + 1} از صفحه فعلی...`);
        let retryCount = 0;
        let success = false;

        while (!success && retryCount < 3) {
          try {
            const detailUrl = `https://poi.raah.ir/web/v4/${token}?format=json`;
            const response = await fetch(detailUrl, {
              signal: AbortSignal.timeout(10000),
            });

            if (response.status === 429) {
              setSearchStatus(`محدودیت درخواست جزئیات - انتظار 10 ثانیه...`);
              startCountdown(10);
              await new Promise(resolve => setTimeout(resolve, 10000));
              clearCountdown();
              retryCount++;
              continue;
            }

            if (response.status === 404) {
              detailed.push({
                token,
                name: `مکان ${startIndex + i + 1}`,
                address: "مکان یافت نشد",
                phone: "مکان یافت نشد",
                rating: null,
                ratingCount: 0,
                category: "نامشخص",
                coordinates: null,
                workingHours: null,
                index: startIndex + i
              });
              success = true;
              break;
            }

            if (response.ok) {
              const detailData = await response.json();
              const placeInfo = {
                token,
                name: detailData.name || `مکان ${startIndex + i + 1}`,
                address: extractAddress(detailData),
                phone: extractPhone(detailData),
                rating: detailData.rating?.score || null,
                ratingCount: detailData.rating?.count || 0,
                category: detailData.category || "نامشخص",
                coordinates: detailData.geometry?.coordinates || null,
                workingHours: extractWorkingHours(detailData),
                index: startIndex + i
              };
              detailed.push(placeInfo);
              success = true;
            } else {
              throw new Error(`HTTP ${response.status}`);
            }
          } catch (error) {
            retryCount++;
            if (retryCount >= 3) {
              detailed.push({
                token,
                name: `مکان ${startIndex + i + 1}`,
                address: "خطا در دریافت اطلاعات",
                phone: "خطا در دریافت اطلاعات",
                rating: null,
                ratingCount: 0,
                category: "نامشخص",
                coordinates: null,
                workingHours: null,
                index: startIndex + i
              });
            } else {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setDetailedResults(prev => [...prev, ...detailed]);
      setSearchStatus(`جزئیات ${detailed.length} مکان از صفحه فعلی دریافت شد.`);
    } catch (error) {
      console.error("Error fetching detailed results for page:", error);
      setSearchStatus("خطا در دریافت جزئیات مکان‌های صفحه فعلی");
      // اضافه کردن placeholder برای جلوگیری از توقف حلقه اصلی
      const placeholderItems = items.map((token, index) => ({
        token,
        name: `مکان ${startIndex + index + 1}`,
        address: "خطا در دریافت جزئیات",
        phone: "خطا در دریافت جزئیات",
        rating: null,
        ratingCount: 0,
        category: "نامشخص",
        coordinates: null,
        workingHours: null,
        index: startIndex + index
      }));
      setDetailedResults(prev => [...prev, ...placeholderItems]);
    } finally {
      setLoadingDetails(false);
    }
  };

  // توابع کمکی
  const extractAddress = (data) => {
    if (data.fields && Array.isArray(data.fields)) {
      const addressField = data.fields.find(f => f.type === 'text' && f.icon === 'gps');
      if (addressField?.value) return addressField.value;
    }
    if (data.seo_details?.schemas?.[0]?.address?.addressLocality) {
      return data.seo_details.schemas[0].address.addressLocality;
    }
    return "آدرس در دسترس نیست";
  };

  const extractPhone = (data) => {
    if (data.fields && Array.isArray(data.fields)) {
      const phoneField = data.fields.find(f => f.type === 'link' && f.icon === 'phone');
      if (phoneField?.text) return phoneField.text;
    }
    if (data.seo_details?.schemas?.[0]?.telephone) {
      return data.seo_details.schemas[0].telephone;
    }
    return "تلفن در دسترس نیست";
  };

  const extractWorkingHours = (data) => {
    if (data.fields && Array.isArray(data.fields)) {
      const hoursField = data.fields.find(f => f.type === 'dropdown' && f.icon === 'clock');
      if (hoursField?.fields?.[0]?.items) {
        const days = hoursField.fields[0].titles;
        const hours = hoursField.fields[0].items;
        return hours[0] ? `${days[0]} ${hours[0]}` : "نامشخص";
      }
    }
    return null;
  };

  // تابع کمکی برای پاکسازی متن فارسی برای CSV
  const cleanPersianText = (text) => {
    if (!text) return "";
    
    return text
      .replace(/"/g, '""')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\t/g, ' ')
      .trim();
  };

  const handleSearch = () => {
    if (selectedCity && selectedCategory) {
      searchPlaces();
    }
  };

  const handlePageChange = (page) => {
    const totalPages = Math.ceil(detailedResults.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
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
    setTimeout(() => setShowCityList(false), 200);
  };

  const getCategoryDisplay = () => {
    const category = categories.find(cat => cat.slug === selectedCategory);
    return category ? category.display : selectedCategory;
  };

  const getPaginatedResults = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return detailedResults.slice(startIndex, endIndex);
  };

  const totalDetailedPages = Math.ceil(detailedResults.length / itemsPerPage);

  const exportToCSV = () => {
    if (detailedResults.length === 0) {
      alert("هیچ مکانی برای صدور CSV وجود ندارد.");
      return;
    }

    const header = [
      "شماره",
      "نام مکان",
      "دسته‌بندی",
      "آدرس",
      "تلفن",
      "امتیاز",
      "تعداد نظرات",
      "ساعت کاری",
      "عرض جغرافیایی",
      "طول جغرافیایی"
    ];

    const csvContent = [header.join(",")];

    detailedResults.forEach((place, index) => {
      const row = [
        index + 1,
        `"${cleanPersianText(place.name)}"`,
        `"${cleanPersianText(place.category)}"`,
        `"${cleanPersianText(place.address)}"`,
        `"${cleanPersianText(place.phone)}"`,
        place.rating ? place.rating.toFixed(1) : "بدون امتیاز",
        place.ratingCount || 0,
        `"${cleanPersianText(place.workingHours || "نامشخص")}"`,
        place.coordinates ? place.coordinates[1].toFixed(6) : "نامشخص",
        place.coordinates ? place.coordinates[0].toFixed(6) : "نامشخص"
      ];
      csvContent.push(row.join(","));
    });

    const BOM = "\uFEFF";
    const csvString = BOM + csvContent.join("\n");
    
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const fileName = `${getCategoryDisplay()}_${selectedCity?.name_fa}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSearchStatus(`فایل CSV با نام "${fileName}" دانلود شد. (با پشتیبانی از فارسی)`);
  };

  const exportToExcel = () => {
    if (detailedResults.length === 0) {
      alert("هیچ مکانی برای صدور Excel وجود ندارد.");
      return;
    }

    const excelData = detailedResults.map((place, index) => ({
      "شماره": index + 1,
      "نام مکان": place.name,
      "دسته‌بندی": place.category,
      "آدرس": place.address,
      "تلفن": place.phone,
      "امتیاز": place.rating ? place.rating.toFixed(1) : "بدون امتیاز",
      "تعداد نظرات": place.ratingCount || 0,
      "ساعت کاری": place.workingHours || "نامشخص",
      "عرض جغرافیایی": place.coordinates ? place.coordinates[1].toFixed(6) : "نامشخص",
      "طول جغرافیایی": place.coordinates ? place.coordinates[0].toFixed(6) : "نامشخص"
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "نتایج جستجو");

    const fileName = `${getCategoryDisplay()}_${selectedCity?.name_fa}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setSearchStatus(`فایل Excel با نام "${fileName}" دانلود شد.`);
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
                جستجوی هوشمند با نام شهر
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base max-w-xl">
                جستجوی پیشرفته مکان‌ها و خدمات در شهرهای ایران با استفاده از API راح
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

          {/* Category Selection using CategoryCombobox */}
          {selectedCity && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">انتخاب دسته‌بندی:</h3>
              
              {loadingCategories ? (
                <div className="max-w-md">
                  <div className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="loading-spinner inline-block w-5 h-5 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">در حال بارگذاری دسته‌بندی‌ها...</span>
                    </div>
                  </div>
                </div>
              ) : categories.length > 0 ? (
                <div className="max-w-md">
                  <CategoryCombobox
                    categories={categories}
                    selected={selectedCategory}
                    setSelected={(categorySlug) => {
                      console.log("Selected category:", categorySlug);
                      setSelectedCategory(categorySlug);
                      setSearchCompleted(false);
                    }}
                  />
                </div>
              ) : (
                <div className="max-w-md">
                  <div className="w-full p-3 border-2 border-red-300 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <span className="text-red-600 dark:text-red-400">خطا در بارگذاری دسته‌بندی‌ها</span>
                    <button 
                      onClick={fetchCategories}
                      className="block mt-2 text-sm text-red-500 hover:text-red-700 underline"
                    >
                      تلاش مجدد
                    </button>
                  </div>
                </div>
              )}
              
              {selectedCategory && categories.length > 0 && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  دسته‌بندی انتخاب شده: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{getCategoryDisplay()}</span>
                </div>
              )}
            </div>
          )}

          {/* Search Button */}
          {selectedCity && selectedCategory && (
            <div className="text-center">
              <button
                onClick={handleSearch}
                disabled={loading}
                className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold shadow-lg transition-all ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : searchCompleted 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner inline-block w-5 h-5 border-4 border-white border-t-transparent rounded-full"></div>
                    <span>در حال جستجو...</span>
                  </>
                ) : searchCompleted ? (
                  <>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>اتمام جستجو</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <span>جستجو در {selectedCity.name_fa}</span>
                  </>
                )}
              </button>
              
              {/* Search Progress */}
              {loading && (
                <div className="mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
                    {searchStatus}
                  </div>
                  {/* Countdown Timer */}
                  {isCountdownActive && countdown > 0 && (
                    <div className="mt-3 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-orange-700 dark:text-orange-300 font-semibold">
                          شروع جستجو تا {countdown} ثانیه دیگر
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading Details */}
        {loadingDetails && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center mb-8">
            <div className="loading-spinner inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
            <div className="text-blue-600 dark:text-blue-400 text-lg font-semibold mb-2">
              در حال دریافت جزئیات مکان‌ها...
            </div>
            <p className="text-blue-500 dark:text-blue-300">
              لطفاً صبر کنید تا اطلاعات کامل دریافت شود
            </p>
            {/* Countdown Timer for Details */}
            {isCountdownActive && countdown > 0 && (
              <div className="mt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg">
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-orange-700 dark:text-orange-300 font-semibold">
                    شروع جستجو تا {countdown} ثانیه دیگر
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Results Table */}
        {detailedResults.length > 0 && (
          <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 sm:p-10 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                نتایج تفصیلی: {getCategoryDisplay()} در {selectedCity?.name_fa}
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {detailedResults.length} مکان یافت شد
                </div>
                {detailedResults.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={exportToCSV}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow transition-colors"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
                      </svg>
                      خروجی CSV
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
                      </svg>
                      خروجی Excel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-50 dark:bg-indigo-900/50">
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      شماره
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      نام مکان
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      دسته‌بندی
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      آدرس
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      تلفن
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      امتیاز
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      ساعت کاری
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      مختصات جغرافیایی
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedResults().map((place, index) => (
                    <tr key={place.token} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center text-gray-600 dark:text-gray-400 text-sm">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-gray-900 dark:text-white font-medium text-sm">
                        {place.name}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-gray-700 dark:text-gray-300 text-sm">
                        <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                          {place.category}
                        </span>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-gray-700 dark:text-gray-300 text-sm max-w-xs">
                        <div className="truncate" title={place.address}>
                          {place.address}
                        </div>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-gray-700 dark:text-gray-300 text-sm">
                        {place.phone}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center text-sm">
                        {place.rating ? (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">⭐</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {place.rating.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {place.ratingCount} نظر
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">بدون امتیاز</span>
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-gray-700 dark:text-gray-300 text-sm text-center">
                        {place.workingHours ? (
                          <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs">
                            {place.workingHours}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">نامشخص</span>
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center text-sm">
                        {place.coordinates ? (
                          <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-xs">
                            {place.coordinates[1].toFixed(4)}, {place.coordinates[0].toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">نامشخص</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination for Detailed Results */}
            {totalDetailedPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  قبلی
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalDetailedPages) }, (_, i) => {
                    let pageNum;
                    if (totalDetailedPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalDetailedPages - 2) {
                      pageNum = totalDetailedPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalDetailedPages, currentPage + 1))}
                  disabled={currentPage >= totalDetailedPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  بعدی
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
              {error}
            </div>
            <p className="text-red-500 dark:text-red-300">
              لطفاً شهر یا دسته‌بندی دیگری را امتحان کنید
            </p>
          </div>
        )}

        {/* Map Section */}
        {selectedCity && (
          <div className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 sm:p-10 mb-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
              <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </span>
              نقشه شهر {selectedCity.name_fa}
            </h2>
            <div className="h-[500px] w-full rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-gray-700 shadow">
              <MapboxMap
                selectedCity={selectedCity}
                onCitySelect={handleCitySelect}
              />
            </div>
          </div>
        )}

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