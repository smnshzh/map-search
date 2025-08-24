import "./globals.css";

export const metadata = {
  title: "نقشه هوشمند ایران - ایران سمارت مپ",
  description: "ابزارهای پیشرفته برای جستجو و تحلیل جغرافیایی شهرهای ایران",
  keywords: "نقشه ایران, شهرهای ایران, جستجوی جغرافیایی, Mapbox, Next.js",
  authors: [{ name: "ایران سمارت مپ" }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/iran-map-logo-small.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.svg',
    apple: '/iran-map-logo-small.svg'
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
