# راهنمای استقرار در Cloudflare Pages

## مشکلات سازگاری حل شده

### 1. مشکلات Leaflet و نقشه
- **مشکل**: CSS imports در کامپوننت‌های client-side
- **راه حل**: استفاده از dynamic imports و loading states
- **نتیجه**: نقشه‌ها در Cloudflare به درستی کار می‌کنند

### 2. مشکلات SSR/CSR
- **مشکل**: تداخل server-side و client-side rendering
- **راه حل**: استفاده از `ssr: false` برای کامپوننت‌های نقشه
- **نتیجه**: عدم خطا در Cloudflare Pages

### 3. پیکربندی Next.js
- **مشکل**: تنظیمات پیش‌فرض برای static export
- **راه حل**: اضافه کردن `output: 'export'` و `trailingSlash: true`
- **نتیجه**: تولید فایل‌های static سازگار با Cloudflare

## مراحل استقرار

### 1. نصب Wrangler CLI
```bash
npm install -g wrangler
```

### 2. ورود به Cloudflare
```bash
wrangler login
```

### 3. ساخت پروژه
```bash
npm run build:cloudflare
```

### 4. استقرار
```bash
wrangler pages deploy out
```

## تنظیمات Cloudflare Pages

### متغیرهای محیطی
- `NODE_ENV`: `production`
- `NEXT_PUBLIC_SUPABASE_URL`: URL دیتابیس Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: کلید عمومی Supabase

### تنظیمات Build
- **Build command**: `npm run build:cloudflare`
- **Build output directory**: `out`
- **Node.js version**: 18 یا بالاتر

## نکات مهم

### 1. محدودیت‌های Cloudflare
- **Server-side API routes**: پشتیبانی نمی‌شوند
- **Database connections**: فقط از طریق client-side
- **File system access**: محدود

### 2. بهینه‌سازی
- **Image optimization**: غیرفعال شده
- **Static generation**: فعال
- **Bundle splitting**: بهینه شده

### 3. عیب‌یابی
- **Console errors**: بررسی در browser console
- **Network requests**: بررسی در Network tab
- **Build logs**: بررسی در Cloudflare dashboard

## تست محلی

### 1. تست static export
```bash
npm run build:cloudflare
npx serve out
```

### 2. تست با Wrangler
```bash
wrangler pages dev out
```

## پشتیبانی

در صورت بروز مشکل:
1. بررسی console errors
2. بررسی build logs
3. تست محلی
4. بررسی compatibility flags
