# نقشه هوشمند ایران - ایران سمارت مپ

## 🗺️ معرفی پروژه

پروژه نقشه هوشمند ایران با استفاده از Next.js 15 و Mapbox ساخته شده است. این پروژه شامل دو بخش اصلی است:

1. **جستجوی هوشمند** - با Leaflet و قابلیت رسم محدوده جغرافیایی
2. **جستجوی شهرها** - با Mapbox و نمایش شهرهای ایران

## ✨ ویژگی‌های کلیدی

### 🚀 جستجوی هوشمند (`/smart-search`)
- نقشه Leaflet تعاملی
- رسم محدوده جغرافیایی (polygon)
- جستجو بر اساس دسته‌بندی
- نمایش نتایج روی نقشه
- سازگار با Cloudflare Pages

### 🏙️ جستجوی شهرها (`/city-search`)
- نقشه Mapbox با کیفیت بالا
- ۳۰ شهر اصلی ایران
- جستجوی real-time
- نمایش اطلاعات شهرها
- رابط کاربری مدرن و responsive

## 🛠️ تکنولوژی‌های استفاده شده

- **Frontend**: Next.js 15, React 19
- **Maps**: Leaflet (Smart Search), Mapbox GL JS (City Search)
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages
- **Build**: Static Export

## 📁 ساختار پروژه

```
src/app/
├── page.js                    # صفحه اصلی
├── layout.js                  # Layout اصلی
├── globals.css               # استایل‌های کلی
├── cities-data.js            # داده‌های شهرها
├── smart-search/             # جستجوی هوشمند
│   ├── page.js              # صفحه اصلی
│   ├── MapWithDraw.js       # نقشه با قابلیت رسم
│   └── ResultMap.js         # نقشه نتایج
└── city-search/              # جستجوی شهرها
    └── page.js              # صفحه اصلی
```

## 🚀 نحوه اجرا

### نصب وابستگی‌ها
```bash
npm install
```

### اجرای development
```bash
npm run dev
```

### Build برای production
```bash
npm run build
```

### Build برای Cloudflare
```bash
npm run build:cloudflare
```

## 🌐 استقرار در Cloudflare Pages

### 1. Build پروژه
```bash
npm run build:cloudflare
```

### 2. Deploy با Wrangler
```bash
npm run deploy:cloudflare
```

### 3. تنظیمات Cloudflare
- Build command: `npm run build:cloudflare`
- Output directory: `out`
- Node.js compatibility: `enabled`

## 🔑 پیکربندی Mapbox

برای استفاده از نقشه Mapbox، Access Token در `next.config.mjs` تنظیم شده است:

```javascript
env: {
  NEXT_PUBLIC_MAPBOX_TOKEN: 'your_mapbox_token_here'
}
```

## 📱 ویژگی‌های UI/UX

- **Responsive Design**: سازگار با تمام دستگاه‌ها
- **Dark Mode**: پشتیبانی از حالت تاریک
- **RTL Support**: پشتیبانی از زبان فارسی
- **Loading States**: نمایش وضعیت بارگذاری
- **Smooth Animations**: انیمیشن‌های نرم

## 🔍 قابلیت‌های جستجو

### جستجوی هوشمند
- انتخاب دسته‌بندی
- رسم محدوده جغرافیایی
- فیلتر نتایج
- نمایش روی نقشه

### جستجوی شهرها
- جستجوی real-time
- فیلتر بر اساس نام
- انتخاب از نقشه
- نمایش اطلاعات شهر

## 📊 داده‌های شهرها

پروژه شامل ۳۰ شهر اصلی ایران است:
- تهران، اصفهان، مشهد، شیراز
- همدان، رشت، تبریز، قم
- کرمان، اهواز، ساری، کرمانشاه
- و سایر شهرهای مهم

هر شهر شامل:
- نام فارسی و انگلیسی
- مختصات جغرافیایی دقیق
- اطلاعات اضافی

## 🚧 عیب‌یابی

### مشکلات رایج
1. **نقشه بارگذاری نمی‌شود**: بررسی Access Token
2. **Build Error**: بررسی import statements
3. **CSS Issues**: بررسی @import order

### راه‌حل‌ها
- بررسی console errors
- بررسی network requests
- بررسی React component state

## 📈 بهینه‌سازی

- **Dynamic Imports**: برای کامپوننت‌های سنگین
- **Lazy Loading**: برای کتابخانه‌های نقشه
- **Static Export**: برای Cloudflare Pages
- **CDN Optimization**: استفاده از CDN Mapbox

## 🔮 توسعه آینده

- [ ] اضافه کردن شهرهای بیشتر
- [ ] نقشه‌های تخصصی
- [ ] قابلیت مقایسه شهرها
- [ ] اطلاعات ترافیک و آب و هوا
- [ ] TypeScript support
- [ ] Unit tests

## 📚 منابع مفید

- [Next.js Documentation](https://nextjs.org/docs)
- [Mapbox GL JS API](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)

## 🤝 مشارکت

برای مشارکت در پروژه:
1. Fork کنید
2. Branch جدید ایجاد کنید
3. تغییرات را commit کنید
4. Pull Request ارسال کنید

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

---

**ساخته شده با ❤️ برای ایران**
