"use client";

import { useEffect, useState } from "react";
import Exhibition from "../components/Exhibition";
import { getGalleryClient } from "../lib/google";

export default function HomePage() {
  const [artworks, setArtworks] = useState(null);

  useEffect(() => {
    let alive = true;
    getGalleryClient()
      .then((items) => {
        if (alive) setArtworks(items);
      })
      .catch((error) => {
        console.error(error);
        if (alive) setArtworks([]);
      });

    return () => { alive = false; };
  }, []);

  if (artworks === null) {
    return (
      <main className="empty-state">
        <div>
          <p className="kicker">NEMAYESHGAH</p>
          <h1>در حال آماده‌سازی نمایشگاه...</h1>
          <p>در حال دریافت آثار از Google Drive هستیم.</p>
        </div>
      </main>
    );
  }

  return <Exhibition artworks={artworks} />;
}
