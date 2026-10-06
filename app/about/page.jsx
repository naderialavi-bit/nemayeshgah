import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="simple-page">
      <header className="site-header">
        <Link className="brand" href="/">NEMAYESHGAH<span>.</span></Link>
        <Link className="header-link" href="/">بازگشت به نمایشگاه</Link>
      </header>
      <section className="about-content">
        <p className="kicker">ABOUT / هنرمند</p>
        <h1>اینجا فضای معرفی نگاه تو به هنر است.</h1>
        <p>
          این متن را می‌توانی بعداً با داستان، بیوگرافی، مسیر هنری و توضیح کوتاهی
          درباره مجموعه آثار خودت جایگزین کنی.
        </p>
      </section>
    </main>
  );
}
