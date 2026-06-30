/**
 * File: js/api.js
 * Mahasiswa 12 – FE Integrasi API & Core PWA
 *
 * Semua komunikasi ke backend Spring Boot dilakukan dari sini.
 * Tidak ada fetch() di file HTML/JS lain — cukup import fungsi ini.
 *
 * Konvensi:
 * - Setiap fungsi mengembalikan Promise<data> (sudah di-parse JSON).
 * - Jika respons gagal (status ≥ 400), fungsi melempar Error dengan
 * pesan dari backend (field "message" atau teks status HTTP).
 * - Token JWT disimpan di localStorage["token"].
 */

// ─── Helper internal ─────────────────────────────────────────────────────────
const BASE_URL = "";

/**
 * Mengambil token JWT yang tersimpan.
 * @returns {string|null}
 */
function getToken() {
  return localStorage.getItem("token");
}

function saveToken(token) {
  localStorage.setItem("token", token);
}

function clearToken() {
  localStorage.removeItem("token");
}

/**
 * Membangun headers standar.
 * @param {boolean} withAuth - sertakan Authorization header?
 * @returns {HeadersInit}
 */
function buildHeaders(withAuth = true) {
  const headers = { "Content-Type": "application/json" };
  if (withAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Wrapper fetch yang menangani error secara seragam.
 * @param {string} endpoint  - path relatif, misal "/api/auth/login"
 * @param {RequestInit} options
 * @returns {Promise<any>}   - parsed JSON body
 */
async function request(endpoint, options = {}) {
  // SINKRONISASI: Menghindari penumpukan jika BASE_URL diisi di kemudian hari
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  // Coba parse body sebagai JSON (mungkin ada pesan error dari Spring)
  let body = null;
  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    body = await response.json();
  }

  if (!response.ok) {
    // FIX: PROTEKSI AUTO-LOGOUT JIKA TOKEN EXPIRED (401 UNAUTHORIZED)
    if (response.status === 401) {
      alert(
        "⚠️ Sesi Anda telah berakhir atau token tidak valid. Silakan login kembali.",
      );
      clearToken();
      window.location.href = "/index.html";
      return;
    }

    // Spring Boot sering mengembalikan { message: "..." } pada error
    const message =
      (body && (body.message || body.error)) ||
      `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return body;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

/**
 * Login pengguna.
 * Backend mengembalikan: { token: "...", role: "USER"|"ADMIN" }
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ token: string, role: string }>}
 */
export async function login(username, password) {
  // 💡 PERBAIKAN: Menghapus BASE_URL ganda di dalam parameter request
  const data = await request("/api/auth/login", {
    method: "POST",
    headers: buildHeaders(false),
    body: JSON.stringify({ username, password }),
  });
  saveToken(data.token);
  return data;
}

/**
 * Logout — hapus token lokal.
 */
export function logout() {
  clearToken();
  window.location.href = "/index.html";
}

/**
 * Registrasi akun baru (status default: belum tervalidasi).
 *
 * @param {{ username, password, email, namaLengkap }} payload
 * @returns {Promise<any>}
 */
export async function register(payload) {
  // 💡 PERBAIKAN: Menyesuaikan path agar lolos security permitAll (/api/auth/**)
  return request("/api/auth/register", {
    method: "POST",
    headers: buildHeaders(false),
    body: JSON.stringify(payload),
  });
}

export async function verifyRegisterOtp(username, otp) {
  return request("/api/auth/register/verify-otp", {
    method: "POST",
    headers: buildHeaders(false),
    body: JSON.stringify({ username, otp }),
  });
}

export async function sendForgotPasswordOtp(username) {
  return request("/api/auth/forgot-password/send-otp", {
    method: "POST",
    headers: buildHeaders(false),
    body: JSON.stringify({ username }),
  });
}

export async function resetPassword(username, otp, newPassword) {
  return request("/api/auth/forgot-password/reset", {
    method: "POST",
    headers: buildHeaders(false),
    body: JSON.stringify({ username, otp, newPassword }),
  });
}

// ─── USER / PROFIL ────────────────────────────────────────────────────────────

/**
 * Mendapatkan data profil pengguna yang sedang login.
 * @returns {Promise<{ id, username, email, namaLengkap, role, tervalidasi }>}
 */
export async function getProfil() {
  return request("/api/user/profil", {
    method: "GET",
    headers: buildHeaders(),
  });
}

/**
 * Memperbarui data profil (Nama & Email) langsung ke database MySQL.
 * @param {{ namaLengkap: string, email: string }} payload
 */
export async function updateProfil(payload) {
  return request("/api/user/profil", {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
}

/**
 * Memperbarui foto profil pengguna.
 * @param {string} fotoBase64 - base64 data URL gambar
 */
export async function updateFotoProfil(fotoBase64) {
  return request("/api/user/profil/foto", {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify({ foto: fotoBase64 }),
  });
}

/**
 * Memverifikasi OTP profil menggunakan DTO asli VerifyOtpRequest kelompokmu
 */
export async function verifyProfileOtp(usernameStr, passwordStr, otpStr) {
  return request("/api/user/profil/verify-otp", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      username: usernameStr,
      password: passwordStr,
      otp: otpStr,
    }),
  });
}

/**
 * [ADMIN] Mendapatkan daftar seluruh user yang belum tervalidasi.
 * @returns {Promise<Array>}
 */
export async function getUserBelumValidasi() {
  return request("/admin/users/pending", {
    method: "GET",
    headers: buildHeaders(),
  });
}

/**
 * [ADMIN] Memvalidasi akun user berdasarkan ID.
 * @param {number|string} userId
 * @returns {Promise<any>}
 */
export async function validasiUser(userId) {
  return request(`/admin/users/${userId}/validasi`, {
    method: "PATCH",
    headers: buildHeaders(),
  });
}

// ─── KATEGORI ─────────────────────────────────────────────────────────────────

export async function getKategori() {
  return request("/api/categories", { method: "GET", headers: buildHeaders() });
}

export async function tambahKategori(payload) {
  return request("/api/categories", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateKategori(id, payload) {
  return request(`/api/categories/${id}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteKategori(id) {
  return request(`/api/categories/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
}

// ─── PEMASUKAN ────────────────────────────────────────────────────────────────

/**
 * Mencatat transaksi pemasukan baru.
 *
 * @param {{ nominal: number, keterangan: string, kategori: string, tanggal: string }} payload
 * @returns {Promise<any>}
 */
export async function tambahPemasukan(payload) {
  return request("/api/transaksi/pemasukan", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updatePemasukan(id, payload) {
  return request(`/api/transaksi/pemasukan/${id}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deletePemasukan(id) {
  return request(`/api/transaksi/pemasukan/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
}

/**
 * Mendapatkan riwayat pemasukan milik pengguna yang login.
 * @param {{ bulan?: number, tahun?: number }} filter - opsional
 * @returns {Promise<Array>}
 */
export async function getRiwayatPemasukan(filter = {}) {
  const params = new URLSearchParams();
  if (filter.bulan) params.append("bulan", filter.bulan);
  if (filter.tahun) params.append("tahun", filter.tahun);
  const query = params.toString() ? `?${params}` : "";

  // 💡 PERBAIKAN: Menambahkan prefix /api agar terbenteng keamanan Spring Security dengan benar
  return request(`/api/transaksi/pemasukan${query}`, {
    method: "GET",
    headers: buildHeaders(),
  });
}

// ─── PENGELUARAN ──────────────────────────────────────────────────────────────

/**
 * Mencatat transaksi pengeluaran baru.
 *
 * @param {{ nominal: number, keterangan: string, kategori: string, tanggal: string }} payload
 * @returns {Promise<any>}
 */
export async function tambahPengeluaran(payload) {
  // 💡 PERBAIKAN FATAL: Kemarin di kode lu tertulis nembak ke /pemasukan, sekarang diganti ke /pengeluaran
  return request("/api/transaksi/pengeluaran", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updatePengeluaran(id, payload) {
  return request(`/api/transaksi/pengeluaran/${id}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deletePengeluaran(id) {
  return request(`/api/transaksi/pengeluaran/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
}

/**
 * Mendapatkan riwayat pengeluaran milik pengguna yang login.
 * @param {{ bulan?: number, tahun?: number }} filter - opsional
 * @returns {Promise<Array>}
 */
export async function getRiwayatPengeluaran(filter = {}) {
  const params = new URLSearchParams();
  if (filter.bulan) params.append("bulan", filter.bulan);
  if (filter.tahun) params.append("tahun", filter.tahun);
  const query = params.toString() ? `?${params}` : "";

  // 💡 PERBAIKAN: Menambahkan prefix /api agar sinkron dengan Controller
  return request(`/api/transaksi/pengeluaran${query}`, {
    method: "GET",
    headers: buildHeaders(),
  });
}

// ─── LAPORAN & DASHBOARD ──────────────────────────────────────────────────────

/**
 * Mendapatkan ringkasan saldo & statistik untuk Dashboard.
 * @returns {Promise<object>}
 */
export async function getDashboardData() {
  return request("/laporan/dashboard", {
    method: "GET",
    headers: buildHeaders(),
  });
}

/**
 * Mendapatkan laporan bulanan lengkap.
 * @param {number} bulan  - 1–12
 * @param {number} tahun  - misal 2026
 * @returns {Promise<object>}
 */
export async function getLaporanBulanan(bulan, tahun) {
  return request(`/laporan/bulanan?bulan=${bulan}&tahun=${tahun}`, {
    method: "GET",
    headers: buildHeaders(),
  });
}

/**
 * Mendapatkan laporan tahunan.
 * @param {number} tahun
 * @returns {Promise<object>}
 */
export async function getLaporanTahunan(tahun) {
  return request(`/laporan/tahunan?tahun=${tahun}`, {
    method: "GET",
    headers: buildHeaders(),
  });
}

// ─── Utilitas ekspor ─────────────────────────────────────────────────────────

/**
 * Cek apakah sesi user masih aktif (token ada di storage).
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!getToken();
}

/**
 * Guard sederhana — panggil di awal setiap halaman yang butuh login.
 * Redirect ke login jika belum autentikasi.
 */
export function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "/index.html";
  }
}
