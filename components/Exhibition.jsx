"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import * as THREE from "three";
import { getArtworkImageUrl } from "../lib/google";

const vertexShader = `
  uniform float uProgress;
  uniform float uTime;
  uniform float uPointSize;
  attribute vec3 aRandom;
  attribute float aSize;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec3 p = position;

    float scatter = smoothstep(0.0, 1.0, uProgress);
    p += aRandom * (0.12 + scatter * (1.0 + aRandom.z * 1.4)) * scatter * 2.6;

    p.x += sin(uTime * 0.7 + aRandom.z * 14.0) * 0.05 * scatter;
    p.y += cos(uTime * 0.9 + aRandom.x * 11.0) * 0.05 * scatter;
    p.z += sin(uTime * 0.6 + aRandom.y * 17.0) * 0.12 * scatter;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    gl_PointSize =
      uPointSize * aSize * (8.0 / max(0.1, -mv.z))
      * (1.0 + scatter * 0.5);

    vAlpha = (1.0 - smoothstep(0.52, 1.0, scatter));
  }
`;

const fragmentShader = `
  precision highp float;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float a = 1.0 - smoothstep(0.06, 0.5, d);
    if (a < 0.02) discard;
    gl_FragColor = vec4(vColor, vAlpha * a);
  }
`;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function fitSize(image) {
  const aspect = image.naturalWidth / Math.max(1, image.naturalHeight);
  let height = window.innerWidth < 900 ? 3.8 : 4.9;
  let width = height * aspect;

  const maxWidth = window.innerWidth < 900 ? 5.6 : 6.25;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / Math.max(0.1, aspect);
  }
  return { width, height };
}

async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Cannot load ${url}`));
    img.src = url;
  });
}

function createParticleImage(image) {
  const { width, height } = fitSize(image);

  const maxDim = window.innerWidth < 900 ? 150 : 190;
  const ratio = Math.min(1, maxDim / Math.max(image.naturalWidth, image.naturalHeight));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.floor(image.naturalWidth * ratio));
  canvas.height = Math.max(2, Math.floor(image.naturalHeight * ratio));

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  let data = null;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch (error) {
    console.warn("Particle color sampling unavailable; using fallback particles.", error);
  }

  const positions = [];
  const randoms = [];
  const sizes = [];
  const colors = [];

  const step = window.innerWidth < 700 ? 2 : 1;

  if (data) {
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const i = (y * canvas.width + x) * 4;
        if (data[i + 3] < 24) continue;

        const u = x / Math.max(1, canvas.width - 1);
        const v = y / Math.max(1, canvas.height - 1);

        positions.push((u - 0.5) * width, (0.5 - v) * height, 0.03);
        colors.push(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
        randoms.push(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        sizes.push(0.55 + Math.random() * 1.35);
      }
    }
  } else {
    const count = window.innerWidth < 700 ? 900 : 1500;
    for (let i = 0; i < count; i++) {
      positions.push((Math.random() - 0.5) * width, (Math.random() - 0.5) * height, Math.random() * 0.15);
      colors.push(0.8, 0.8, 0.8);
      randoms.push(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
      sizes.push(0.45 + Math.random() * 1.1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("aRandom", new THREE.Float32BufferAttribute(randoms, 3));
  geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));

  const texture = new THREE.Texture(image);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1 })
  );

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    uniforms: {
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uPointSize: { value: 0.78 },
    },
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const group = new THREE.Group();
  group.add(plane, points);

  return { group, plane, points };
}

export default function Exhibition({ artworks }) {
  const canvasRef = useRef(null);
  const hostRef = useRef(null);
  const infoRef = useRef(null);
  const indexRef = useRef(null);
  const totalRef = useRef(null);
  const nodeRef = useRef([]);
  const artworkRef = useRef(artworks);
  artworkRef.current = artworks;

  useEffect(() => {
    if (!canvasRef.current || !hostRef.current || !artworks.length) return;

    const canvas = canvasRef.current;
    const host = hostRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 8.7;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const stage = new THREE.Group();
    stage.position.x = innerWidth < 900 ? 0 : 1.0;
    stage.position.y = innerWidth < 900 ? 0.9 : 0;
    scene.add(stage);

    let destroyed = false;
    let nodes = [];
    let raf = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const info = infoRef.current;
    if (indexRef.current) indexRef.current.textContent = "01";
    if (totalRef.current) totalRef.current.textContent = String(artworks.length).padStart(2, "0");

    function renderInfo(index, progress) {
      const current = artworks[index];
      const next = artworks[index + 1];

      if (!info) return;

      const currentOpacity = reduced ? 1 : 1 - clamp(progress * 1.4, 0, 1);
      const nextOpacity = next && !reduced ? clamp((progress - 0.08) / 0.6, 0, 1) : 0;

      info.innerHTML = `
        <div class="info-current" style="opacity:${currentOpacity};transform:translateY(${progress * 18}px)">
          <p class="kicker">${String(current.order).padStart(2, "0")} / ARTWORK</p>
          <h1>${escapeHTML(current.title)}</h1>
          <p class="description">${escapeHTML(current.description)}</p>
          <div class="meta">
            <span>${escapeHTML(current.year)}</span>
            <span>${escapeHTML(current.technique)}</span>
          </div>
          <a class="more-link" href="${process.env.NEXT_PUBLIC_BASE_PATH || ""}/artwork/?slug=${encodeURIComponent(
            current.slug || current.title
          )}">مشاهده جزئیات اثر ←</a>
        </div>
        <div class="info-next" style="opacity:${nextOpacity};transform:translateY(${(1-nextOpacity) * 18}px)">
          ${
            next
              ? `
            <p class="kicker">${String(next.order).padStart(2, "0")} / ARTWORK</p>
            <h1>${escapeHTML(next.title)}</h1>
            <p class="description">${escapeHTML(next.description)}</p>
            <div class="meta">
              <span>${escapeHTML(next.year)}</span>
              <span>${escapeHTML(next.technique)}</span>
            </div>`
              : ""
          }
        </div>
      `;

      if (indexRef.current) indexRef.current.textContent = String(index + 1).padStart(2, "0");
    }

    async function init() {
      const images = await Promise.all(artworks.map((a) => loadImage(getArtworkImageUrl(a.fileId))));

      if (destroyed) return;

      nodes = images.map((image, index) => {
        const node = createParticleImage(image);
        node.group.visible = index === 0;
        stage.add(node.group);
        return node;
      });

      nodeRef.current = nodes;
      renderInfo(0, 0);

      function update() {
        const index = clamp(Math.floor(scrollY / innerHeight), 0, artworks.length - 1);
        let progress = clamp((scrollY - index * innerHeight) / innerHeight, 0, 1);
        if (index === artworks.length - 1) progress = 0;

        nodes.forEach((node, i) => {
          node.group.visible = i === index || i === index + 1;
        });

        const current = nodes[index];
        const next = nodes[index + 1];

        if (current) {
          const dissolve = reduced ? 0 : progress;
          current.plane.material.opacity = reduced ? 1 : 1 - dissolve;
          if (current.points) current.points.material.uniforms.uProgress.value = dissolve;
          current.group.scale.setScalar(1 + dissolve * 0.028);
        }

        if (next) {
          const reveal = reduced ? 1 : clamp((progress - 0.08) / 0.68, 0, 1);
          next.plane.material.opacity = reveal;
          if (next.points) next.points.material.uniforms.uProgress.value = 0;
          next.group.scale.setScalar(1.035 - reveal * 0.035);
        }

        renderInfo(index, progress);
      }

      const onScroll = () => update();
      const onResize = () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
        stage.position.x = innerWidth < 900 ? 0 : 1.0;
        stage.position.y = innerWidth < 900 ? 0.9 : 0;
        update();
      };

      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onResize);
      update();

      function animate(time) {
        if (destroyed) return;
        const seconds = time * 0.001;
        nodes.forEach((node) => {
          if (node.points) node.points.material.uniforms.uTime.value = seconds;
        });
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      }

      raf = requestAnimationFrame(animate);

      return () => {
        removeEventListener("scroll", onScroll);
        removeEventListener("resize", onResize);
        cancelAnimationFrame(raf);
      };
    }

    let cleanup = () => {};
    init().then((fn) => { if (fn) cleanup = fn; }).catch(console.error);

    return () => {
      destroyed = true;
      cleanup();
      nodes.forEach((node) => {
        node.group.traverse((object) => {
          if (object.material) {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
          if (object.geometry) object.geometry.dispose();
        });
      });
      renderer.dispose();
      scene.clear();
    };
  }, [artworks]);

  if (!artworks.length) {
    return (
      <main className="empty-state">
        <header className="site-header">
          <Link className="brand" href="/">NEMAYESHGAH<span>.</span></Link>
          <Link className="header-link" href="/about">درباره</Link>
        </header>
        <div>
          <p className="kicker">NEMAYESHGAH</p>
          <h1>هنوز اثری برای نمایش اضافه نشده است.</h1>
          <p>اول Google Drive و Google Sheets را طبق راهنمای پروژه تنظیم کن.</p>
        </div>
      </main>
    );
  }

  return (
    <main ref={hostRef} className="exhibition">
      <canvas ref={canvasRef} className="webgl" />

      <header className="site-header">
        <Link className="brand" href="/">NEMAYESHGAH<span>.</span></Link>
        <div className="header-actions">
          <Link className="header-link" href="/about">درباره هنرمند</Link>
        </div>
      </header>

      <div className="counter">
        <span ref={indexRef}>01</span>
        <span className="counter-line" />
        <span ref={totalRef}>00</span>
      </div>

      <section className="info-panel" ref={infoRef} />

      <div className="scroll-hint">
        <span>SCROLL</span>
        <span className="arrow">↓</span>
      </div>

      <div className="grain" />
      {artworks.map((_, index) => <div className="scroll-section" key={index} />)}
    </main>
  );
}
