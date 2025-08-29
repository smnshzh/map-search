# Cloudflare Pages Deployment

## 🚀 مراحل استقرار در Cloudflare Pages

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
npm run deploy:cloudflare
```

## 📁 ساختار فایل‌ها

- `functions/neighborhood.js` - Cloudflare Function برای API
- `out/` - فایل‌های static export
- `wrangler.toml` - تنظیمات Cloudflare Workers

## 🔧 نکات مهم

1. **Development Mode**: از Next.js API routes استفاده می‌کنیم (`/api/neighborhood`)
2. **Production Mode**: از Cloudflare Functions استفاده می‌کنیم (`/functions/neighborhood`)
3. **Static Export**: برای Cloudflare، `output: 'export'` را در `next.config.mjs` فعال کنید
4. **CORS**: CORS headers در Cloudflare Function تنظیم شده

## 🔄 تغییرات برای Cloudflare

### 1. فعال کردن static export
```javascript
// next.config.mjs
output: 'export', // Uncomment for Cloudflare
```

### 2. تغییر API URL
```javascript
// در صفحه neighborhood-extraction
const url = `/functions/neighborhood?lon=${lon}&lat=${lat}`;
```

## 🌐 URL نهایی

پس از استقرار، URL به شکل زیر خواهد بود:
```
https://map-nextjs.pages.dev
```

## 🐛 عیب‌یابی

اگر با خطا مواجه شدید:
1. `wrangler.toml` را بررسی کنید
2. Cloudflare Function را تست کنید
3. Console browser را بررسی کنید
