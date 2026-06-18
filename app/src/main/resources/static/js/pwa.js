/**
 * pwa.js
 * Mahasiswa 12 – FE Integrasi API & Core PWA
 *
 * Mendaftarkan Service Worker (sw.js) ke browser.
 * Sertakan script ini di semua halaman HTML:
 *   <script src="js/pwa.js" defer></script>
 *
 * Fitur:
 *  - Registrasi SW dengan scope "/"
 *  - Deteksi update SW (versi baru di-install di background)
 *  - Notifikasi toast jika ada versi baru — user bisa refresh
 *  - Deteksi status online/offline → tampilkan banner
 */

(function () {
  "use strict";

  // ─── Service Worker Registration ──────────────────────────────────────────

  if (!("serviceWorker" in navigator)) {
    console.warn("[PWA] Browser ini tidak mendukung Service Worker.");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log(
        "[PWA] Service Worker terdaftar. Scope:",
        registration.scope
      );

      // ── Deteksi update SW ──────────────────────────────────────────────
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // Ada versi baru yang siap — tampilkan notifikasi
            showUpdateToast();
          }
        });
      });

      // ── Cek update setiap kali halaman di-navigate ─────────────────────
      registration.update();
    } catch (error) {
      console.error("[PWA] Gagal mendaftarkan Service Worker:", error);
    }
  });

  // Ketika SW baru mengambil alih, reload otomatis agar cache segar
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  // ─── Toast "Ada Pembaruan" ────────────────────────────────────────────────

  function showUpdateToast() {
    // Hindari duplikat
    if (document.getElementById("pwa-update-toast")) return;

    const toast = document.createElement("div");
    toast.id = "pwa-update-toast";
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
      <span>Versi baru tersedia!</span>
      <button id="pwa-reload-btn">Perbarui Sekarang</button>
      <button id="pwa-dismiss-btn" aria-label="Tutup">✕</button>
    `;

    // Style inline minimalis — tidak bergantung pada css/style.css
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "1.5rem",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      background: "#1e293b",
      color: "#f8fafc",
      padding: "0.75rem 1.25rem",
      borderRadius: "0.5rem",
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      fontSize: "0.875rem",
      zIndex: "9999",
      fontFamily: "system-ui, sans-serif",
    });

    const btnStyle = {
      border: "none",
      borderRadius: "0.25rem",
      padding: "0.35rem 0.75rem",
      cursor: "pointer",
      fontSize: "0.8rem",
    };

    const reloadBtn = toast.querySelector("#pwa-reload-btn");
    Object.assign(reloadBtn.style, {
      ...btnStyle,
      background: "#3b82f6",
      color: "#fff",
    });

    const dismissBtn = toast.querySelector("#pwa-dismiss-btn");
    Object.assign(dismissBtn.style, {
      ...btnStyle,
      background: "transparent",
      color: "#94a3b8",
    });

    reloadBtn.addEventListener("click", () => {
      // Kirim pesan ke SW agar skip waiting lalu halaman reload
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      }
      toast.remove();
    });

    dismissBtn.addEventListener("click", () => toast.remove());

    document.body.appendChild(toast);
  }

  // ─── Banner Online / Offline ──────────────────────────────────────────────

  function createOfflineBanner() {
    if (document.getElementById("pwa-offline-banner")) return;

    const banner = document.createElement("div");
    banner.id = "pwa-offline-banner";
    banner.setAttribute("role", "status");
    banner.textContent = "⚡ Anda sedang offline — menampilkan data tersimpan";

    Object.assign(banner.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      background: "#f59e0b",
      color: "#1c1917",
      textAlign: "center",
      padding: "0.5rem",
      fontSize: "0.8rem",
      fontFamily: "system-ui, sans-serif",
      fontWeight: "600",
      zIndex: "9998",
      letterSpacing: "0.01em",
    });

    document.body.prepend(banner);
  }

  function removeOfflineBanner() {
    const banner = document.getElementById("pwa-offline-banner");
    if (banner) banner.remove();
  }

  // Pasang listener
  window.addEventListener("offline", createOfflineBanner);
  window.addEventListener("online", removeOfflineBanner);

  // Cek kondisi awal saat halaman dimuat
  if (!navigator.onLine) createOfflineBanner();
})();
