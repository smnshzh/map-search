import Link from "next/link";

export default function Home() {
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Smart Search Card */}
            <Link href="/smart-search" className="group">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 p-6 rounded-xl border-2 border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-700 transition-colors">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                    جستجوی هوشمند
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    جستجوی پیشرفته نقاط مورد نظر با رسم محدوده جغرافیایی
                  </p>
                </div>
              </div>
            </Link>

            {/* City Search Card */}
            <Link href="/city-search" className="group">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-700 transition-colors">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                    جستجوی شهرها
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    نقشه تعاملی شهرهای ایران با قابلیت جستجو و انتخاب
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              این پروژه با Next.js و Mapbox ساخته شده و برای استقرار در Cloudflare بهینه شده است.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
