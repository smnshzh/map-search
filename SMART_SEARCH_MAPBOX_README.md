# صفحه جستجوی هوشمند - Smart Search (Mapbox Version)

## معرفی

صفحه "جستجوی هوشمند" به‌روزرسانی شده و حالا از Mapbox به جای Leaflet استفاده می‌کند. این تغییر باعث بهبود عملکرد و سازگاری بهتر با Cloudflare Pages می‌شود.

## ویژگی‌های جدید

### 🗺️ نقشه Mapbox با قابلیت رسم
- **Mapbox GL JS**: موتور نقشه پیشرفته و سریع
- **Mapbox Draw**: قابلیت رسم محدوده جغرافیایی
- **Navigation Controls**: کنترل‌های zoom و pan
- **Real-time Drawing**: رسم polygon به صورت real-time

### ✏️ قابلیت‌های رسم
- **رسم محدوده**: کلیک روی نقشه برای ایجاد نقاط
- **تکمیل خودکار**: کلیک روی نقطه اول برای تکمیل polygon
- **ویرایش**: امکان ویرایش و تغییر شکل محدوده
- **حذف**: پاک کردن کامل محدوده رسم شده

### 🔍 جستجوی هوشمند
- **انتخاب دسته‌بندی**: ۴ دسته‌بندی مختلف
- **فیلتر نتایج**: نمایش نتایج بر اساس دسته‌بندی
- **نمایش نقشه**: نمایش نتایج روی نقشه
- **جدول نتایج**: نمایش اطلاعات در قالب جدول

## ساختار فایل‌ها

```
src/app/smart-search/
├── page.js                    # صفحه اصلی (به‌روزرسانی شده)
├── MapboxMapWithDraw.js       # نقشه با قابلیت رسم (جدید)
├── MapboxResultMap.js         # نقشه نمایش نتایج (جدید)
└── [فایل‌های قدیمی Leaflet]  # نگهداری شده برای مرجع
```

## تکنولوژی‌های استفاده شده

### Frontend
- **Next.js 15**: Framework اصلی
- **React 19**: کتابخانه UI
- **Mapbox GL JS**: موتور نقشه
- **Mapbox Draw**: قابلیت رسم

### Map Services
- **Mapbox Streets Style**: استایل نقشه
- **Custom Drawing Tools**: ابزارهای رسم سفارشی
- **Interactive Markers**: مارکرهای تعاملی
- **Real-time Updates**: به‌روزرسانی لحظه‌ای

## نحوه استفاده

### 1. انتخاب دسته‌بندی
- روی یکی از ۴ دسته‌بندی کلیک کنید:
  - 🚦 دوربین ترافیک
  - 🔒 دوربین امنیتی
  - 🌿 دوربین محیطی
  - 🏭 دوربین صنعتی

### 2. رسم محدوده جغرافیایی
- روی دکمه "✏️ رسم محدوده" کلیک کنید
- روی نقشه کلیک کنید تا نقاط محدوده را ایجاد کنید
- برای تکمیل، روی نقطه اول دوباره کلیک کنید
- برای پاک کردن، از دکمه "🗑️ پاک کردن" استفاده کنید

### 3. اجرای جستجو
- پس از رسم محدوده و انتخاب دسته‌بندی
- روی دکمه "جستجو" کلیک کنید
- نتایج پس از ۲ ثانیه نمایش داده می‌شوند

### 4. مشاهده نتایج
- **نقشه نتایج**: نمایش نقاط روی نقشه
- **جدول نتایج**: اطلاعات کامل در قالب جدول
- **وضعیت**: نمایش وضعیت فعال/غیرفعال

## نمونه داده‌ها

### نتایج نمونه
```javascript
const sampleResults = [
  {
    id: 1,
    name: "دوربین ترافیک خیابان ولیعصر",
    category: "دوربین ترافیک",
    lng: 51.3890,
    lat: 35.6892,
    description: "دوربین نظارت بر ترافیک در تقاطع اصلی",
    status: "active"
  },
  // ... سایر نتایج
];
```

### نقاط دوربین
```javascript
const cameraPointsWithStatus = [
  { lng: 51.3890, lat: 35.6892, name: "دوربین 1", status: "active" },
  { lng: 51.4000, lat: 35.7000, name: "دوربین 2", status: "active" },
  // ... سایر نقاط
];
```

## پیکربندی Mapbox

### Access Token
```javascript
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic21uc2h6aCIsImEiOiJjbWU3YzlpZjEwMnV3MmlzaXFsMTU0ZTYxIn0.JoucB_gPN8eUkeVAv6pi8w';
```

### Map Style
```javascript
mapStyle="mapbox://styles/mapbox/streets-v12"
```

## ویژگی‌های UI/UX

### طراحی مدرن
- **Gradient Background**: پس‌زمینه گرادیانت سبز
- **Card Design**: کارت‌های مدرن با سایه
- **Responsive Layout**: طراحی responsive
- **Dark Mode Support**: پشتیبانی از حالت تاریک

### انیمیشن‌ها
- **Hover Effects**: افکت‌های hover
- **Scale Transitions**: انیمیشن‌های scale
- **Loading States**: نمایش وضعیت بارگذاری
- **Smooth Transitions**: انتقال‌های نرم

## بهینه‌سازی

### Performance
- **Dynamic Imports**: بارگذاری lazy کامپوننت‌ها
- **Mapbox GL JS**: موتور نقشه بهینه
- **Efficient Rendering**: رندر بهینه
- **Memory Management**: مدیریت حافظه

### Cloudflare Compatibility
- **Static Export**: export کامل static
- **No SSR Dependencies**: عدم وابستگی به SSR
- **CDN Optimization**: بهینه‌سازی CDN
- **Fast Loading**: بارگذاری سریع

## عیب‌یابی

### مشکلات رایج

#### 1. نقشه بارگذاری نمی‌شود
- بررسی Access Token
- بررسی console errors
- بررسی network requests

#### 2. قابلیت رسم کار نمی‌کند
- بررسی Mapbox Draw plugin
- بررسی CSS imports
- بررسی JavaScript errors

#### 3. نتایج نمایش داده نمی‌شوند
- بررسی polygon data
- بررسی search logic
- بررسی component state

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

## مقایسه با نسخه Leaflet

### مزایای Mapbox
- **Performance**: عملکرد بهتر
- **Quality**: کیفیت نقشه بالاتر
- **Features**: ویژگی‌های بیشتر
- **Compatibility**: سازگاری بهتر با Cloudflare

### ویژگی‌های مشترک
- **Drawing Tools**: ابزارهای رسم
- **Search Functionality**: قابلیت جستجو
- **Results Display**: نمایش نتایج
- **Responsive Design**: طراحی responsive

## توسعه آینده

### ویژگی‌های پیشنهادی
- [ ] اضافه کردن دسته‌بندی‌های بیشتر
- [ ] قابلیت ذخیره محدوده‌ها
- [ ] export نتایج به فرمت‌های مختلف
- [ ] نقشه‌های تخصصی
- [ ] قابلیت اشتراک‌گذاری

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

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Mapbox Draw Plugin](https://docs.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/)
- [React Map GL](https://visgl.github.io/react-map-gl/)
- [Next.js Documentation](https://nextjs.org/docs)

---

**نسخه Mapbox - بهبود یافته برای عملکرد بهتر و سازگاری بیشتر**
