function getScriptUrl() {
  const configured = typeof window !== "undefined"
    ? window.NEMAYESHGAH_CONFIG?.GOOGLE_APPS_SCRIPT_URL
    : "";

  if (configured) return configured;

  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL;
  if (fromEnv) return fromEnv;

  throw new Error("Google Apps Script URL is missing.");
}

export function getGalleryClient() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Gallery data can only be loaded in the browser."));
      return;
    }

    let scriptUrl;

    try {
      scriptUrl = getScriptUrl();
    } catch (error) {
      reject(error);
      return;
    }

    const callbackName = `__nemayeshgah_gallery_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    const script = document.createElement("script");
    const url = new URL(scriptUrl);

    url.searchParams.set("callback", callbackName);

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
        new Error("Google Apps Script request timed out.")
      );
    }, 20000);

    window[callbackName] = (payload) => {
      const artworks = Array.isArray(payload?.artworks)
        ? payload.artworks
        : [];

      finish(resolve, artworks);
    };

    script.async = true;
    script.src = url.toString();

    script.onerror = () => {
      finish(
        reject,
        new Error("Google Apps Script request failed.")
      );
    };

    document.head.appendChild(script);
  });
}

export function getGallery() {
  return getGalleryClient();
}

/*
  تصویر را از Google Apps Script دریافت می‌کنیم.
  Apps Script تصویر را از Google Drive می‌خواند
  و به صورت Data URL برمی‌گرداند.
*/
export function getArtworkImageUrl(fileId) {
  if (!fileId) return "";

  const scriptUrl = getScriptUrl();

  return `${scriptUrl}?image=${encodeURIComponent(fileId)}`;
}

export function slugify(input) {
  return encodeURIComponent(
    String(input || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^؀-ۿ\w-]+/g, "")
      .replace(/-+/g, "-")
  );
}