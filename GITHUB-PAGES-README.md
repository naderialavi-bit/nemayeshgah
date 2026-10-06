# NEMAYESHGAH — نسخه آماده GitHub Pages

این پروژه به نسخه استاتیک تبدیل شده و برای GitHub Pages آماده است.

## نکته مهم

GitHub Pages فقط فایل‌های استاتیک را میزبانی می‌کند؛ بنابراین این نسخه اطلاعات آثار را در مرورگر از Google Apps Script می‌گیرد. Next.js نیز برای static export، قابلیت client-side data fetching را پشتیبانی می‌کند.

برای اینکه مرورگر بدون نیاز به سرور Next.js اطلاعات را از Apps Script بگیرد، `Code.gs` به JSONP مجهز شده است. مستندات رسمی Google Apps Script این روش را برای سرویس‌های JSON توضیح می‌دهد.

## انتشار

1. یک Repository در GitHub بساز.
2. همه فایل‌های این پروژه را داخل ریشه Repository قرار بده.
3. تغییرات `Code.gs` را در Apps Script ذخیره و Deployment وب‌اپ را به آخرین نسخه به‌روزرسانی کن.
4. در GitHub از `Settings → Pages`، گزینه `GitHub Actions` را به‌عنوان Source انتخاب کن.
5. یک Push به شاخه `main` انجام بده؛ Workflow خودش سایت را Build و Deploy می‌کند.

نام Repository هرچه باشد، کد در زمان Build به‌صورت خودکار base path همان Repository را تشخیص می‌دهد.

## آدرس معمول

`https://USERNAME.github.io/REPOSITORY/`

## Google Drive

فایل‌های تصویر باید برای بازدیدکنندگان قابل مشاهده باشند: `Anyone with the link → Viewer`.
