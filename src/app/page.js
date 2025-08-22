import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-center">🗺️ سامانه جستجوی هوشمند راه (Raah)</h1>
      <p className="mb-8 text-lg text-center max-w-xl">
        به سامانه جستجوی هوشمند خوش آمدید! در این سامانه می‌توانید با انتخاب دسته‌بندی و محدوده جغرافیایی، نقاط مورد نظر خود را روی نقشه جستجو و مشاهده کنید.
      </p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link href="/smart-search" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded text-center transition">
          🚀 جستجوی هوشمند
        </Link>
        {/* سایر صفحات در صورت نیاز */}
      </div>
      <footer className="mt-16 text-gray-400 text-sm text-center">
        <p>ساخته شده با Next.js و Tailwind CSS</p>
      </footer>
    </main>
  );
}
