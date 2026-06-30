/**
 * sw.js  —  Service Worker
 * Mahasiswa 12 – FE Integrasi API & Core PWA
 *
 * Strategi cache:
 * • Static assets (HTML, CSS, JS, ikon)  → Cache-First
 * File-file ini jarang berubah; ambil dari cache dulu, lebih cepat.
 * ... (komentar lainnya tetap sama)
 */

// 1. NAIKKAN VERSI CACHE (Wajib setiap ada perubahan file HTML/CSS/JS)
const CACHE_VERSION = "v1.1.2";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// 2. TAMBAHKAN SEMUA FILE JS DAN CSS BARU KE SINI
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/dashboard.html",
  "/pemasukan.html",
  "/pengeluaran.html",
  "/laporan.html",
  "/profil.html",
  "/admin.html",
  "/offline.html",
  "/css/components.css", // <--- CSS Global yang baru kita buat
  "/css/style.css", // (Biarkan jika masih ada file lama yang pakai ini)
  "/js/api.js",
  "/js/auth.js", // <--- Tambahan
  "/js/dashboard.js", // <--- Tambahan
  "/js/laporan.js", // <--- Tambahan
  "/js/profil.js", // <--- Tambahan
  "/js/transaksi.js", // <--- Tambahan
  "/js/pwa.js",
  "/manifest.json",
  "/assets/icons/icon-192.png", // Pastikan folder assets ini benar-benar ada di proyek Anda
  "/assets/icons/icon-512.png",
];

// ── INSTALL: pre-cache semua static assets ───────────────────────────────────
self.addEventListener("install", (event) => {
  console.log(`[SW ${CACHE_VERSION}] Installing...`);

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => {
        console.log(`[SW] Pre-cache selesai (${STATIC_ASSETS.length} aset).`);
        // Langsung aktif — tidak menunggu tab lama ditutup
        return self.skipWaiting();
      })
      .catch((err) => console.error("[SW] Pre-cache gagal:", err)),
  );
});

// ── ACTIVATE: hapus cache versi lama ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log(`[SW ${CACHE_VERSION}] Activating...`);

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
            .map((key) => {
              console.log("[SW] Menghapus cache lama:", key);
              return caches.delete(key);
            }),
        ),
      )
      .then(() => self.clients.claim()), // ambil alih semua tab yang terbuka
  );
});

// ── FETCH: terapkan strategi berdasarkan tipe request ────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Abaikan request non-GET (POST/PATCH/DELETE transaksi tidak di-cache)
  if (request.method !== "GET") return;

  // Abaikan request ke domain lain (CDN Chart.js, dll.)
  if (url.origin !== self.location.origin) return;

  // ── 1. API Request → Network-First ──────────────────────────────────────
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // ── 2. Navigasi HTML → Cache-First + fallback offline ───────────────────
  if (request.mode === "navigate") {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // ── 3. Static Assets → Cache-First ──────────────────────────────────────
  event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
});

// ── Pesan dari pwa.js (tombol "Perbarui Sekarang") ───────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ─── Implementasi Strategi ───────────────────────────────────────────────────

/**
 * Cache-First: coba ambil dari cache, jika tidak ada baru ke jaringan.
 * Hasil jaringan disimpan kembali ke cache.
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Tidak ada di cache & offline — kembalikan respons error sederhana
    return new Response("Resource tidak tersedia saat offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/**
 * Network-First: coba ambil dari jaringan, simpan ke cache.
 * Jika jaringan gagal, fallback ke cache.
 */
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    // Tidak ada cache sama sekali — kembalikan JSON error agar api.js bisa tangani
    return new Response(
      JSON.stringify({
        message: "Tidak ada koneksi internet dan data belum tersimpan.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }
}

/**
 * Navigasi: Cache-First, fallback ke offline.html jika semua gagal.
 */
async function navigationStrategy(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const offlinePage = await cache.match("/offline.html");
    return (
      offlinePage ||
      new Response("<h1>Offline</h1><p>Periksa koneksi internet Anda.</p>", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    );
  }
}
