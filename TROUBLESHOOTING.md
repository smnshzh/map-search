# راهنمای عیب‌یابی مشکلات نقشه

## مشکلات رایج و راه‌حل‌ها

### 🔴 مشکل 1: نقشه اصلاً بارگذاری نمی‌شود

#### علائم:
- صفحه خالی نمایش داده می‌شود
- پیام "در حال بارگذاری نقشه..." نمایش داده می‌شود
- خطا در console

#### راه‌حل‌ها:

##### 1. بررسی Console
```bash
# در browser console (F12) بررسی کنید:
# - خطاهای JavaScript
# - خطاهای CSS loading
# - خطاهای network
```

##### 2. بررسی CSS Loading
```css
/* در globals.css باید این خطوط وجود داشته باشند */
@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
@import url('https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css');
```

##### 3. بررسی Network Tab
- در Developer Tools > Network tab بررسی کنید
- فایل‌های CSS و JS Leaflet باید با موفقیت بارگذاری شوند

### 🔴 مشکل 2: نقشه بارگذاری می‌شود اما tiles نمایش داده نمی‌شوند

#### علائم:
- نقشه خالی است
- خطای CORS
- خطای 403 یا 404

#### راه‌حل‌ها:

##### 1. بررسی CORS
```javascript
// در TileLayer از URL معتبر استفاده کنید
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
/>
```

##### 2. بررسی Network Requests
- در Network tab بررسی کنید که tiles درخواست می‌شوند
- اگر خطای 403 دارید، از API key استفاده کنید

### 🔴 مشکل 3: نقشه در Cloudflare کار نمی‌کند

#### علائم:
- نقشه در localhost کار می‌کند
- در Cloudflare خطا می‌دهد
- خطای hydration

#### راه‌حل‌ها:

##### 1. بررسی پیکربندی Next.js
```javascript
// next.config.mjs
const nextConfig = {
  output: 'export',           // برای static export
  trailingSlash: true,        // سازگاری با Cloudflare
  images: { unoptimized: true }
};
```

##### 2. بررسی Dynamic Imports
```javascript
// کامپوننت‌های نقشه باید با ssr: false import شوند
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
```

##### 3. بررسی Loading States
```javascript
// کامپوننت‌ها باید loading states مناسب داشته باشند
if (!mounted || !leafletLoaded) {
  return <LoadingSpinner />;
}
```

### 🔴 مشکل 4: خطای "L is not defined"

#### علائم:
- خطای "L is not defined" در console
- نقشه بارگذاری نمی‌شود

#### راه‌حل‌ها:

##### 1. بررسی Leaflet Import
```javascript
// در useEffect بررسی کنید که Leaflet بارگذاری شده
useEffect(() => {
  const loadLeaflet = async () => {
    try {
      await import("leaflet");
      setLeafletLoaded(true);
    } catch (error) {
      console.warn("Failed to load Leaflet:", error);
    }
  };
  loadLeaflet();
}, []);
```

##### 2. استفاده از window.L
```javascript
// به جای require از window.L استفاده کنید
if (typeof window !== "undefined" && window.L) {
  return window.L.icon({ ... });
}
```

### 🔴 مشکل 5: نقشه کند بارگذاری می‌شود

#### علائم:
- بارگذاری طولانی
- عملکرد کند

#### راه‌حل‌ها:

##### 1. بهینه‌سازی CSS Loading
```css
/* CSS را در globals.css import کنید */
@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
```

##### 2. استفاده از CDN
```javascript
// از CDN معتبر استفاده کنید
const leafletCSS = document.createElement('link');
leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
```

## تست و تأیید

### 1. تست محلی
```bash
# ساخت پروژه
npm run build:cloudflare

# تست static export
npx serve out
```

### 2. تست با Wrangler
```bash
# تست محلی با Cloudflare
wrangler pages dev out
```

### 3. بررسی Build Logs
```bash
# بررسی خطاهای build
npm run build:cloudflare 2>&1 | tee build.log
```

## عیب‌یابی پیشرفته

### 1. بررسی Bundle Size
```bash
# بررسی اندازه فایل‌های تولید شده
npm run build:cloudflare
ls -la out/_next/static/chunks/
```

### 2. بررسی Dependencies
```bash
# بررسی وابستگی‌های Leaflet
npm ls leaflet react-leaflet
```

### 3. بررسی Compatibility
```bash
# بررسی سازگاری با Cloudflare
npm run build:cloudflare
# اگر موفق بود، سازگار است
```

## تماس با پشتیبانی

در صورت عدم حل مشکل:

1. **Console Logs**: تمام خطاها را کپی کنید
2. **Network Logs**: درخواست‌های ناموفق را ثبت کنید
3. **Build Logs**: خروجی build را ذخیره کنید
4. **Environment**: مرورگر، OS و نسخه Node.js را مشخص کنید

## منابع مفید

- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [React Leaflet](https://react-leaflet.js.org/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
