/**
 * admin.js — FinanceBuddy Admin Dashboard
 * ─────────────────────────────────────────
 * Fitur:
 *  1. Auth guard — redirect ke login jika tidak ada token / bukan ADMIN
 *  2. Load stat cards  : Total User, User Menunggu, Tervalidasi
 *  3. Load tabel user  : seluruh user + badge status + tombol Validasi/Tolak
 *  4. Filter tab       : Semua | Menunggu | Tervalidasi | Ditolak
 *  5. Live search      : cari nama / email / username
 *  6. Aksi validasi    : PUT /api/admin/users/{id}/validasi
 *  7. Profil mini      : tampilkan inisial username di topbar
 *  8. Logout
 */

const BASE = "/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function token() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(BASE + path, { ...options, headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `HTTP ${res.status}`);
  return body;
}

function formatTanggal(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function inisial(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── State ─────────────────────────────────────────────────────────────────────

let allUsers   = [];
let activeTab  = "SEMUA";
let searchQuery = "";

// ── Auth Guard ────────────────────────────────────────────────────────────────

function guardAuth() {
  if (!token()) { window.location.href = "/index.html"; return false; }
  try {
    const payload = JSON.parse(atob(token().split(".")[1]));
    const roles = payload.roles || [];
    const isAdmin = roles.includes("ROLE_ADMIN") || payload.role === "ROLE_ADMIN";
    if (!isAdmin) {
      alert("Akses ditolak. Halaman ini hanya untuk Admin.");
      window.location.href = "/dashboard.html";
      return false;
    }
  } catch { window.location.href = "/index.html"; return false; }
  return true;
}

// ── Stat Cards ────────────────────────────────────────────────────────────────

async function loadStatCards() {
  try {
    const res  = await apiFetch("/admin/users");
    const users = res.data || [];
    setText("statTotalUser",   users.length);
    setText("statMenunggu",    users.filter((u) => u.status === "BELUM_TERVALIDASI").length);
    setText("statTervalidasi", users.filter((u) => u.status === "TERVALIDASI").length);
  } catch (err) { console.error("Gagal load stat:", err.message); }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Tabel User ────────────────────────────────────────────────────────────────

async function loadUsers() {
  try {
    const res = await apiFetch("/admin/users");
    allUsers  = res.data || [];
    renderTable();
  } catch (err) {
    showTableError("Gagal memuat data user: " + err.message);
  }
}

function renderTable() {
  const tbody = document.getElementById("userTableBody");
  if (!tbody) return;

  let filtered = allUsers;
  if (activeTab !== "SEMUA")
    filtered = filtered.filter((u) => u.status === activeTab);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.namaLengkap?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;padding:40px;">
      ${searchQuery ? "Tidak ada user yang cocok dengan pencarian." : "Belum ada data user."}
    </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((u) => {
    const badge = badgeStatus(u.status);
    return `
      <tr data-id="${u.id}">
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="avatar-circle">${inisial(u.namaLengkap || u.username)}</div>
            <div>
              <div style="font-weight:600;font-size:14px;">${u.namaLengkap || "-"}</div>
              <div style="font-size:12px;color:#999;">@${u.username}</div>
            </div>
          </div>
        </td>
        <td style="font-size:13px;color:#555;">${u.email || "-"}</td>
        <td><span class="${badge.cls}">${badge.label}</span></td>
        <td style="font-size:12px;color:#888;">${formatTanggal(u.createdAt)}</td>
        <td style="font-size:12px;color:#888;">${formatTanggal(u.validatedAt)}</td>
        <td>${tombolAksi(u)}</td>
      </tr>`;
  }).join("");
}

function badgeStatus(status) {
  switch (status) {
    case "TERVALIDASI":       return { cls: "badge badge-success", label: "✓ Tervalidasi" };
    case "DITOLAK":           return { cls: "badge badge-danger",  label: "✗ Ditolak" };
    case "BELUM_TERVALIDASI":
    default:                  return { cls: "badge badge-warning", label: "⏳ Menunggu" };
  }
}

function tombolAksi(u) {
  if (u.status === "BELUM_TERVALIDASI") return `
    <div style="display:flex;gap:6px;">
      <button class="btn-aksi btn-val"  onclick="aksiValidasi(${u.id},'TERVALIDASI')">✓ Validasi</button>
      <button class="btn-aksi btn-tolak" onclick="aksiValidasi(${u.id},'DITOLAK')">✗ Tolak</button>
    </div>`;
  if (u.status === "TERVALIDASI") return `
    <button class="btn-aksi btn-tolak" onclick="aksiValidasi(${u.id},'DITOLAK')">✗ Tolak</button>`;
  if (u.status === "DITOLAK") return `
    <button class="btn-aksi btn-val" onclick="aksiValidasi(${u.id},'TERVALIDASI')">↺ Aktifkan</button>`;
  return "-";
}

function showTableError(msg) {
  const tbody = document.getElementById("userTableBody");
  if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#dc3545;padding:30px;">${msg}</td></tr>`;
}

// ── Aksi Validasi ─────────────────────────────────────────────────────────────

window.aksiValidasi = async function (id, status) {
  const label = status === "TERVALIDASI" ? "memvalidasi" : "menolak";
  if (!confirm(`Yakin ingin ${label} user ini?`)) return;
  try {
    await apiFetch(`/admin/users/${id}/validasi`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    const idx = allUsers.findIndex((u) => u.id === id);
    if (idx !== -1) {
      allUsers[idx].status = status;
      if (status === "TERVALIDASI") allUsers[idx].validatedAt = new Date().toISOString();
    }
    renderTable();
    loadStatCards();
    showToast(
      status === "TERVALIDASI" ? "User berhasil divalidasi ✓" : "User ditolak.",
      status === "TERVALIDASI" ? "success" : "danger"
    );
  } catch (err) { showToast("Gagal: " + err.message, "danger"); }
};

// ── Tab Filter ────────────────────────────────────────────────────────────────

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeTab = btn.dataset.tab;
      renderTable();
    });
  });
}

// ── Search ────────────────────────────────────────────────────────────────────

function setupSearch() {
  const input = document.getElementById("searchUser");
  if (!input) return;
  input.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderTable();
  });
}

// ── Profil Mini ───────────────────────────────────────────────────────────────

function loadProfilMini() {
  try {
    const payload = JSON.parse(atob(token().split(".")[1]));
    const name = payload.sub || "AD";
    const el = document.getElementById("profileMini");
    if (el) el.textContent = inisial(name);
  } catch { /* silent */ }
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(msg, type = "success") {
  const old = document.getElementById("adminToast");
  if (old) old.remove();
  const toast = document.createElement("div");
  toast.id = "adminToast";
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    padding:14px 22px;border-radius:12px;font-size:14px;font-weight:500;
    color:white;box-shadow:0 4px 20px rgba(0,0,0,.15);
    background:${type === "success" ? "#4F8A7B" : "#dc3545"};
    animation:toastIn .3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Styles ────────────────────────────────────────────────────────────────────

function injectStyles() {
  const s = document.createElement("style");
  s.textContent = `
    @keyframes toastIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

    .badge-success { background:#d8f1e8; color:#2d5d52; }
    .badge-warning { background:#fff3cd; color:#856404; }
    .badge-danger  { background:#f8d7da; color:#842029; }
    .badge { padding:5px 12px; border-radius:20px; font-size:12px; font-weight:500; display:inline-block; }

    .btn-aksi { padding:6px 14px; font-size:12px; border-radius:8px; border:none; cursor:pointer; font-weight:500; transition:.2s; font-family:inherit; }
    .btn-val  { background:#4F8A7B; color:white; }
    .btn-val:hover  { background:#3d7062; }
    .btn-tolak { background:#dc3545; color:white; }
    .btn-tolak:hover { background:#b02a37; }

    .avatar-circle {
      width:36px;height:36px;border-radius:50%;
      background:#d8f1e8;color:#2d5d52;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;flex-shrink:0;
    }

    .tabs { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
    .tab-btn {
      padding:7px 18px; border:1px solid #ddd; border-radius:20px;
      background:white; cursor:pointer; font-size:13px; color:#555;
      transition:.2s; font-family:inherit;
    }
    .tab-btn:hover { border-color:#4F8A7B; color:#4F8A7B; }
    .tab-btn.active { background:#4F8A7B; color:white; border-color:#4F8A7B; }

    .search-box {
      width:100%; padding:10px 16px; border:1px solid #ddd;
      border-radius:10px; font-size:13px; outline:none; margin-bottom:16px;
      font-family:inherit;
    }
    .search-box:focus { border-color:#4F8A7B; }

    .card-value { font-size:32px; font-weight:700; color:#2d5d52; margin-top:6px; }
    .card-title { font-size:13px; color:#888; font-weight:500; }

    table th { font-size:12px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:.5px; }
    table tr:hover td { background:#fafafa; }

    .logout-btn { background:#f8d7da !important; color:#842029 !important; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:13px; font-family:inherit; font-weight:500; transition:.2s; }
    .logout-btn:hover { background:#f1aeb5 !important; }
  `;
  document.head.appendChild(s);
}

// ── Rebuild UI ────────────────────────────────────────────────────────────────

function rebuildUI() {
  const content = document.querySelector(".content");
  if (!content) return;
  content.innerHTML = `
    <div class="topbar">
      <h1 class="page-title">Admin Dashboard</h1>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:13px;color:#888;" id="greetAdmin">Selamat datang, Admin</span>
        <div class="profile-mini" id="profileMini">AD</div>
        <button class="logout-btn" onclick="doLogout()">Logout</button>
      </div>
    </div>

    <div class="grid grid-3" style="margin-bottom:24px;">
      <div class="card">
        <div class="card-title">Total User Terdaftar</div>
        <div class="card-value" id="statTotalUser">—</div>
      </div>
      <div class="card">
        <div class="card-title">Menunggu Validasi</div>
        <div class="card-value" id="statMenunggu" style="color:#856404;">—</div>
      </div>
      <div class="card">
        <div class="card-title">Sudah Tervalidasi</div>
        <div class="card-value" id="statTervalidasi">—</div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:16px;font-weight:600;">Manajemen User</h3>
        <button class="btn-aksi btn-val" onclick="loadUsers();loadStatCards();">↺ Refresh</button>
      </div>

      <input type="text" id="searchUser" class="search-box" placeholder="🔍  Cari nama, username, atau email...">

      <div class="tabs">
        <button class="tab-btn active" data-tab="SEMUA">Semua</button>
        <button class="tab-btn" data-tab="BELUM_TERVALIDASI">⏳ Menunggu</button>
        <button class="tab-btn" data-tab="TERVALIDASI">✓ Tervalidasi</button>
        <button class="tab-btn" data-tab="DITOLAK">✗ Ditolak</button>
      </div>

      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Nama / Username</th>
              <th>Email / No. WA</th>
              <th>Status</th>
              <th>Terdaftar</th>
              <th>Divalidasi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="userTableBody">
            <tr><td colspan="6" style="text-align:center;color:#999;padding:40px;">Memuat data...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ── Logout ────────────────────────────────────────────────────────────────────

window.doLogout = function () {
  if (!confirm("Yakin ingin logout?")) return;
  localStorage.removeItem("token");
  window.location.href = "/index.html";
};

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  if (!guardAuth()) return;
  injectStyles();
  rebuildUI();
  loadProfilMini();
  setupTabs();
  setupSearch();
  loadStatCards();
  loadUsers();
});