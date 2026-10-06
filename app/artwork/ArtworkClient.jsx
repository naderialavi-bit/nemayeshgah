"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getArtworkImageUrl,
  getGalleryClient,
} from "../../lib/google";

async function loadArtworkImage(url) {
  return new Promise((resolve, reject) => {
    const callbackName =
      `__pichart_detail_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;

    const script = document.createElement("script");

    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    };

    const finish = (fn, value) => {
      if (settled) return;

      settled = true;
      cleanup();
      fn(value);
    };

    const timeout = window.setTimeout(() => {
      finish(
        reject,
        new Error("Image request timed out.")
      );
    }, 30000);

    window[callbackName] = (payload) => {
      if (!payload?.ok || !payload?.data) {
        finish(
          reject,
          new Error(
            payload?.error ||
              "Image data is missing."
          )
        );
        return;
      }

      finish(resolve, payload.data);
    };

    try {
      const requestUrl = new URL(url);

      requestUrl.searchParams.set(
        "callback",
        callbackName
      );

      script.async = true;
      script.src = requestUrl.toString();

      script.onerror = () => {
        finish(
          reject,
          new Error(
            "Google Apps Script image request failed."
          )
        );
      };

      document.head.appendChild(script);
    } catch (error) {
      finish(reject, error);
    }
  });
}

export default function ArtworkClient() {
  const searchParams = useSearchParams();

  const id =
    searchParams.get("id") || "";

  const oldSlug =
    searchParams.get("slug") || "";

  const [state, setState] =
    useState({
      loading: true,
      artwork: null,
      image: "",
    });

  useEffect(() => {
    let alive = true;

    async function load() {
      setState({
        loading: true,
        artwork: null,
        image: "",
      });

      try {
        const artworks =
          await getGalleryClient();

        /*
         * روش اصلی:
         * پیدا کردن اثر با fileId
         */
        let artwork =
          artworks.find(
            (item) =>
              String(item.fileId) ===
              String(id)
          );

        /*
         * سازگاری با لینک‌های قدیمی
         */
        if (!artwork && oldSlug) {
          artwork =
            artworks.find(
              (item) =>
                encodeURIComponent(
                  String(
                    item.title || ""
                  )
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                ) === oldSlug
            );
        }

        if (!artwork) {
          if (alive) {
            setState({
              loading: false,
              artwork: null,
              image: "",
            });
          }

          return;
        }

        /*
         * تصویر را از Apps Script می‌گیریم
         * و به Data URL تبدیل می‌کنیم.
         */
        const image =
          await loadArtworkImage(
            getArtworkImageUrl(
              artwork.fileId
            )
          );

        if (!alive) return;

        setState({
          loading: false,
          artwork,
          image,
        });
      } catch (error) {
        console.error(
          "Artwork page failed:",
          error
        );

        if (alive) {
          setState({
            loading: false,
            artwork: null,
            image: "",
          });
        }
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [id, oldSlug]);

  return (
    <main className="detail-page">
      <header className="site-header">
        <Link
          className="brand"
          href="/"
        >
          Pichart<span>.</span>
        </Link>

        <Link
          className="header-link"
          href="/"
        >
          نمایشگاه
        </Link>
      </header>

      {state.loading ? (
        <main className="empty-state">
          <div>
            <p className="kicker">
              PICHART
            </p>

            <h1>
              در حال بارگذاری اثر...
            </h1>
          </div>
        </main>
      ) : state.artwork ? (
        <section className="detail-grid">
          <div className="detail-image-wrap">
            {state.image && (
              <img
                src={state.image}
                alt={
                  state.artwork.title
                }
              />
            )}
          </div>

          <article className="detail-copy">
            <p className="kicker">
              {String(
                state.artwork.order
              ).padStart(
                2,
                "0"
              )}{" "}
              / ARTWORK
            </p>

            <h1>
              {state.artwork.title}
            </h1>

            <p>
              {state.artwork.description}
            </p>

            <div className="detail-meta">
              <span>
                {state.artwork.year}
              </span>

              <span>
                {state.artwork.technique}
              </span>
            </div>

            <Link
              className="more-link"
              href="/"
            >
              ← بازگشت به نمایشگاه
            </Link>
          </article>
        </section>
      ) : (
        <main className="empty-state">
          <div>
            <p className="kicker">
              PICHART
            </p>

            <h1>
              اثر پیدا نشد.
            </h1>

            <Link
              className="more-link"
              href="/"
            >
              بازگشت به نمایشگاه ←
            </Link>
          </div>
        </main>
      )}
    </main>
  );
}