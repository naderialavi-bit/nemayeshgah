# NEMAYESHGAH — نسخه آماده انتشار آنلاین

این نسخه برای GitHub Pages آماده شده است. ظاهر نمایشگاه و اتصال به Google Drive / Google Sheets حفظ شده، اما بخش‌های نیازمند سرور Next.js به نسخه استاتیک تبدیل شده‌اند.

## قبل از انتشار فقط یک کار در Google Apps Script

فایل `google-apps-script/Code.gs` در این نسخه به JSONP مجهز شده است. محتوای این فایل را جایگزین کد قبلی Apps Script کن، ذخیره کن، و Web App را به نسخه جدید Deploy کن.

URL فعلی Web App داخل `public/config.js` قرار داده شده است.

## انتشار در GitHub

1. یک Repository جدید بساز. مثلا `nemayeshgah`.
2. فایل‌های این پوشه را در ریشه Repository قرار بده.
3. در Repository برو به `Settings → Pages` و در بخش `Build and deployment`، گزینه `GitHub Actions` را انتخاب کن.
4. شاخه `main` را Push کن. Workflow موجود در `.github/workflows/deploy.yml` خودش پروژه را Build و منتشر می‌کند.

GitHub Pages از سایت‌های استاتیک پشتیبانی می‌کند و GitHub Actions امکان Build و Deploy خروجی استاتیک را فراهم می‌کند.

## آدرس سایت

برای Repository معمولی: `https://USERNAME.github.io/REPOSITORY/`

کد پروژه نام Repository را هنگام Build تشخیص می‌دهد و `basePath` لازم را خودش تنظیم می‌کند.

## Google Drive

تصاویر باید برای بازدیدکننده قابل مشاهده باشند: `Anyone with the link → Viewer`.

## تغییر آثار در آینده

بعد از اینکه سایت آنلاین شد، تغییرات Google Drive و Google Sheet از طریق Apps Script در مرورگر خوانده می‌شوند و برای به‌روزرسانی محتوای نمایشگاه لازم نیست هر بار خود سایت را تغییر بدهی.
