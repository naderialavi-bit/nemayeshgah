import "./globals.css";

export const metadata = {
  title: "NEMAYESHGAH — نمایشگاه دیجیتال",
  description: "یک نمایشگاه دیجیتال تعاملی برای آثار هنری",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <script src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/config.js`} />{children}</body>
    </html>
  );
}
