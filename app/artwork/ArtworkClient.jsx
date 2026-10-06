"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getArtworkImageUrl, getGalleryClient, slugify } from "../../lib/google";

export default function ArtworkClient() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";
  const [state, setState] = useState({ loading: true, artwork: null });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, artwork: null });
    getGalleryClient()
      .then((artworks) => {
        if (!alive) return;
        const artwork = artworks.find((item) => slugify(item.title) === slug);
        setState({ loading: false, artwork: artwork || null });
      })
      .catch((error) => {
        console.error(error);
        if (alive) setState({ loading: false, artwork: null });
      });
    return () => { alive = false; };
  }, [slug]);

  return (
    <main className="detail-page">
      <header className="site-header">
        <Link className="brand" href="/">NEMAYESHGAH<span>.</span></Link>
        <Link className="header-link" href="/">نمایشگاه</Link>
      </header>

      {state.loading ? (
        <main className="empty-state"><div><p className="kicker">NEMAYESHGAH</p><h1>در حال بارگذاری اثر...</h1></div></main>
      ) : state.artwork ? (
        <section className="detail-grid">
          <div className="detail-image-wrap">
            <img src={getArtworkImageUrl(state.artwork.fileId)} alt={state.artwork.title} />
          </div>
          <article className="detail-copy">
            <p className="kicker">{String(state.artwork.order).padStart(2, "0")} / ARTWORK</p>
            <h1>{state.artwork.title}</h1>
            <p>{state.artwork.description}</p>
            <div className="detail-meta"><span>{state.artwork.year}</span><span>{state.artwork.technique}</span></div>
          </article>
        </section>
      ) : (
        <main className="empty-state"><div><p className="kicker">NEMAYESHGAH</p><h1>اثر پیدا نشد.</h1><Link className="more-link" href="/">بازگشت به نمایشگاه ←</Link></div></main>
      )}
    </main>
  );
}
