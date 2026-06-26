/**
 * File: js/profil.js
 * Pengelola Data Profil & Konfigurasi Finansial Dinamis
 * 💡 FIX: Menggunakan arsitektur Local-First agar data tidak hilang/terhapus saat refresh
 */
import { getProfil, requireAuth } from "./api.js";

// 1. Kunci proteksi halaman login
requireAuth();

async function muatDataProfil() {
  // 💡 LANGKAH KUNCI: Ambil dari memori aplikasi DULUAN sebelum menyentuh server
  const namaLokal = localStorage.getItem("user_nama");
  const emailLokal = localStorage.getItem("user_email");
  const targetLokal = localStorage.getItem("target_tabungan");
  const budgetLokal = localStorage.getItem("limit_anggaran");

  // Jika di memori lokal sudah ada isinya, langsung pasang ke layar (Anti-Kosong)
  if (namaLokal) {
    document.getElementById("lblNamaUser").innerText = namaLokal;
    document.getElementById("txtNamaLengkap").value = namaLokal;
  }
  if (emailLokal) {
    document.getElementById("lblEmailUser").innerText = emailLokal;
    document.getElementById("txtEmail").value = emailLokal;
  }
  if (targetLokal) {
    document.getElementById("txtTargetTabungan").value = targetLokal;
  } else {
    document.getElementById("txtTargetTabungan").value = "500000"; // Fallback awal
  }
  if (document.getElementById("txtBatasBudget")) {
    document.getElementById("txtBatasBudget").value = budgetLokal || "1000000";
  }

  // 💡 LANGKAH KEDUA: Baru tembak API server.
  // Jika server error/lambat, data di kolom input lu di atas TIDAK AKAN terganggu/terhapus!
  try {
    const profil = await getProfil();

    // Sinkronisasi cadangan jika memori lokal browser ternyata kosong bersih
    if (!localStorage.getItem("user_nama") && profil.namaLengkap) {
      document.getElementById("lblNamaUser").innerText = profil.namaLengkap;
      document.getElementById("txtNamaLengkap").value = profil.namaLengkap;
      localStorage.setItem("user_nama", profil.namaLengkap);
    }
    if (!localStorage.getItem("user_email") && profil.email) {
      document.getElementById("lblEmailUser").innerText = profil.email;
      document.getElementById("txtEmail").value = profil.email;
      localStorage.setItem("user_email", profil.email);
    }
    if (!localStorage.getItem("target_tabungan") && profil.targetTabungan) {
      document.getElementById("txtTargetTabungan").value =
        profil.targetTabungan;
      localStorage.setItem("target_tabungan", profil.targetTabungan);
    }
  } catch (err) {
    console.warn(
      "Koneksi API server lambat, aplikasi aman menggunakan data lokal.",
    );
  }
}

// Pastikan struktur DOM HTML sudah siap total sebelum dieksekusi
document.addEventListener("DOMContentLoaded", () => {
  muatDataProfil();

  const formProfil = document.getElementById("formProfil");
  if (formProfil) {
    formProfil.addEventListener("submit", (e) => {
      e.preventDefault();

      const namaInput = document.getElementById("txtNamaLengkap").value.trim();
      const emailInput = document.getElementById("txtEmail").value.trim();
      const targetInput = document.getElementById("txtTargetTabungan").value;
      const budgetInput = document.getElementById("txtBatasBudget").value;

      // Kunci mati semua data ke dalam memori internal aplikasi browser
      localStorage.setItem("user_nama", namaInput);
      localStorage.setItem("user_email", emailInput);
      localStorage.setItem("target_tabungan", targetInput);
      localStorage.setItem("limit_anggaran", budgetInput);

      // Ubah teks display atas avatar secara instan
      document.getElementById("lblNamaUser").innerText = namaInput;
      document.getElementById("lblEmailUser").innerText = emailInput;

      alert(
        "🎉 Perubahan data akun, target tabungan, dan batas budget bulanan sukses dikunci di aplikasi!",
      );
    });
  }
});
