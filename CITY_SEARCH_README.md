# صفحه جستجوی شهرها - City Search

## معرفی

صفحه جدید "جستجوی شهرها" با استفاده از Mapbox و React Map GL ساخته شده است. این صفحه امکان جستجو و انتخاب شهرهای مختلف ایران را فراهم می‌کند.

## ویژگی‌ها

### 🗺️ نقشه تعاملی
- نقشه Mapbox با کیفیت بالا
- نمایش تمام شهرهای ایران با مارکرهای آبی
- قابلیت zoom و pan
- مرکزیت نقشه روی ایران

### 🔍 جستجوی پیشرفته
- جستجو بر اساس نام فارسی یا انگلیسی
- فیلتر کردن نتایج به صورت real-time
- نمایش dropdown با نتایج جستجو
- انتخاب شهر از لیست

### 📍 نمایش اطلاعات شهر
- نمایش نام فارسی و انگلیسی
- مختصات جغرافیایی دقیق
- Popup اطلاعات شهر روی نقشه
- هایلایت شهر انتخاب شده

### 📱 رابط کاربری مدرن
- طراحی responsive
- پشتیبانی از dark mode
- انیمیشن‌های نرم
- UI/UX بهینه

## ساختار فایل‌ها

```
src/app/
├── city-search/
│   └── page.js              # صفحه اصلی جستجوی شهرها
├── smart-search/
│   └── MapboxMap.js         # کامپوننت نقشه Mapbox
├── cities-data.js            # داده‌های شهرهای ایران
└── globals.css               # استایل‌های کلی و Mapbox
```

## نحوه استفاده

### 1. جستجوی شهر
- در فیلد جستجو نام شهر را تایپ کنید
- نتایج به صورت real-time فیلتر می‌شوند
- روی شهر مورد نظر کلیک کنید

### 2. انتخاب از نقشه
- روی مارکر آبی شهر کلیک کنید
- اطلاعات شهر در popup نمایش داده می‌شود
- نقشه به صورت خودکار روی شهر انتخاب شده zoom می‌کند

### 3. انتخاب از لیست
- در پایین صفحه لیست تمام شهرها موجود است
- روی کارت شهر کلیک کنید
- شهر انتخاب شده هایلایت می‌شود

## داده‌های شهرها

فایل `cities-data.js` شامل ۳۰ شهر اصلی ایران است:

```javascript
export const cities = [
  {"name_fa": "تهران", "name_en": "Tehran", "coordinates": [51.3890, 35.6892]},
  {"name_fa": "اصفهان", "name_en": "Isfahan", "coordinates": [51.6746, 32.6546]},
  // ... سایر شهرها
];
```

هر شهر شامل:
- `name_fa`: نام فارسی
- `name_en`: نام انگلیسی  
- `coordinates`: مختصات جغرافیایی [longitude, latitude]

## تکنولوژی‌های استفاده شده

### Frontend
- **Next.js 15**: Framework اصلی
- **React Map GL 8**: کتابخانه نقشه Mapbox
- **Tailwind CSS**: استایل‌دهی
- **Dynamic Imports**: بهینه‌سازی بارگذاری

### Map Services
- **Mapbox GL JS**: موتور نقشه
- **Mapbox Streets Style**: استایل نقشه
- **Custom Markers**: مارکرهای سفارشی
- **Interactive Popups**: پاپ‌آپ‌های تعاملی

## پیکربندی

### متغیرهای محیطی
```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_access_token
```

### Mapbox Access Token
- برای استفاده از Mapbox نیاز به Access Token دارید
- در صورت عدم وجود، از token عمومی استفاده می‌شود
- برای production حتماً token معتبر تنظیم کنید

## بهینه‌سازی

### Performance
- Dynamic imports برای کامپوننت‌های نقشه
- Lazy loading برای کتابخانه‌های سنگین
- بهینه‌سازی re-renders با useCallback و useMemo

### SEO
- Static generation برای تمام صفحات
- Meta tags مناسب
- Structured data برای شهرها

## سازگاری با Cloudflare

### Static Export
- تمام صفحات به صورت static export می‌شوند
- سازگار با Cloudflare Pages
- عدم نیاز به server-side rendering

### CDN Optimization
- استفاده از CDN Mapbox
- بهینه‌سازی asset loading
- Caching مناسب

## عیب‌یابی

### مشکلات رایج

#### 1. نقشه بارگذاری نمی‌شود
- بررسی Access Token
- بررسی CORS settings
- بررسی console errors

#### 2. شهرها نمایش داده نمی‌شوند
- بررسی فایل cities-data.js
- بررسی import statements
- بررسی React component state

#### 3. جستجو کار نمی‌کند
- بررسی search logic
- بررسی filteredCities state
- بررسی event handlers

### راه‌حل‌ها

#### بررسی Console
```bash
# در browser console بررسی کنید:
# - خطاهای JavaScript
# - خطاهای Mapbox
# - خطاهای React
```

#### بررسی Network
- درخواست‌های Mapbox
- بارگذاری CSS و JS
- خطاهای CORS

## توسعه آینده

### ویژگی‌های پیشنهادی
- [ ] اضافه کردن شهرهای بیشتر
- [ ] فیلتر بر اساس استان
- [ ] نمایش اطلاعات اضافی شهرها
- [ ] قابلیت مقایسه شهرها
- [ ] نقشه‌های تخصصی (ترافیک، آب و هوا)

### بهبودهای فنی
- [ ] TypeScript support
- [ ] Unit tests
- [ ] E2E tests
- [ ] Performance monitoring
- [ ] Error tracking

## پشتیبانی

در صورت بروز مشکل:
1. بررسی console errors
2. بررسی network requests
3. بررسی React component state
4. بررسی Mapbox configuration

## منابع مفید

- [React Map GL Documentation](https://visgl.github.io/react-map-gl/)
- [Mapbox GL JS API](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
