/**
 * File: js/laporan.js
 * Engine Pengolah Jurnal Laporan Gabungan & Statistik Keuangan
 * 💡 FITUR TERBARU: Filter Rentang Tanggal, Filter Tahun Dinamis, Data Caching, HSL Golden Angle
 * 🚀 PERFORMANCE: Dioptimasi menggunakan Promise.all untuk mencegah API Waterfall
 */
import {
  getRiwayatPemasukan,
  getRiwayatPengeluaran,
  requireAuth,
  logout,
} from "./api.js";

requireAuth();

// Variabel Global untuk Caching & Instance Grafik
let cachePemasukan = [];
let cachePengeluaran = [];
let barChartInst = null;
let donutChartInst = null;

const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("Apakah Anda yakin ingin keluar dari FinanceBuddy?")) {
      logout();
    }
  });
}

const btnCetak = document.getElementById("btnCetakLaporan");
if (btnCetak) {
  btnCetak.onclick = () => window.print();
}

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka || 0);
};

// PENYELARASAN WARNA DINAMIS HSL + GOLDEN ANGLE
const mapWarnaKategori = {
  BONUS: { bg: "#059669", text: "#ffffff" },
  UANG_SAKU: { bg: "#0d9488", text: "#ffffff" },
  GAJI_PART_TIME: { bg: "#0284c7", text: "#ffffff" },
  FREELANCE: { bg: "#4f46e5", text: "#ffffff" },
  MAKANAN: { bg: "#e11d48", text: "#ffffff" },
  MAKAN: { bg: "#e11d48", text: "#ffffff" },
  TRANSPORT: { bg: "#ea580c", text: "#ffffff" },
  BELAJAR: { bg: "#2563eb", text: "#ffffff" },
  KOST: { bg: "#475569", text: "#ffffff" },
  HIBURAN: { bg: "#d97706", text: "#ffffff" },
  TAGIHAN: { bg: "#dc2626", text: "#ffffff" },
};

function ambilGayaWarnaKategori(namaKat) {
  const key = (namaKat || "LAINNYA").toUpperCase().trim().replace(/\s+/g, "_");
  if (mapWarnaKategori[key]) return mapWarnaKategori[key];

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.floor(Math.abs(hash) * 137.5) % 360;
  return { bg: `hsl(${hue}, 75%, 45%)`, text: "#ffffff" };
}

// 💡 INIT HALAMAN & FETCH DATA VIA PROMISE.ALL (PARALEL)
async function initHalamanLaporan() {
  try {
    // ── 💡 OPTIMASI UTAMA: TARIK DATA TRANSAKSI SEPARALEL / SEKALIGUS ──
    const [pemasukanData, pengeluaranData] = await Promise.all([
      getRiwayatPemasukan().catch(() => []),
      getRiwayatPengeluaran().catch(() => []),
    ]);

    // Simpan ke Cache Memory
    cachePemasukan = pemasukanData || [];
    cachePengeluaran = pengeluaranData || [];

    setupFilterDinamis();

    // Render laporan pertama kali: Pakai tahun berjalan
    const tahunSekarang = new Date().getFullYear();
    document.getElementById("filterTahun").value = tahunSekarang;
    renderLaporanBerdasarkanFilter(tahunSekarang, null, null);
  } catch (error) {
    console.error("Gagal memuat modul laporan:", error);
  }
}

// 💡 SETUP UI FILTER
function setupFilterDinamis() {
  const selectTahun = document.getElementById("filterTahun");
  const tglMulai = document.getElementById("filterTglMulai");
  const tglSelesai = document.getElementById("filterTglSelesai");
  const btnTerapkan = document.getElementById("btnTerapkanFilter");
  const btnReset = document.getElementById("btnResetFilter");

  // Ekstrak Tahun dari Data Transaksi untuk isi Dropdown
  const himpunanTahun = new Set();
  const semuaData = [...cachePemasukan, ...cachePengeluaran];
  semuaData.forEach((item) => {
    if (item.tanggal) {
      himpunanTahun.add(new Date(item.tanggal).getFullYear());
    }
  });

  const tahunSekarang = new Date().getFullYear();
  himpunanTahun.add(tahunSekarang); // Pastikan tahun ini selalu ada

  const arrayTahun = Array.from(himpunanTahun).sort((a, b) => b - a); // Urut dari terbaru

  selectTahun.innerHTML = `<option value="ALL">Semua Tahun</option>`;
  arrayTahun.forEach((thn) => {
    selectTahun.innerHTML += `<option value="${thn}">${thn}</option>`;
  });

  // Event Listener Tombol Terapkan Filter
  btnTerapkan.onclick = () => {
    const valTahun = selectTahun.value;
    const valMulai = tglMulai.value;
    const valSelesai = tglSelesai.value;

    if ((valMulai && !valSelesai) || (!valMulai && valSelesai)) {
      alert("❌ Harap isi kedua rentang tanggal (Mulai dan Sampai)!");
      return;
    }

    // Jika rentang tanggal diisi, prioritasnya adalah tanggal. Jika tidak, pakai filter dropdown tahun.
    renderLaporanBerdasarkanFilter(
      valMulai ? null : valTahun === "ALL" ? null : valTahun,
      valMulai,
      valSelesai,
    );
  };

  // Event Listener Tombol Reset
  btnReset.onclick = () => {
    selectTahun.value = tahunSekarang;
    tglMulai.value = "";
    tglSelesai.value = "";
    renderLaporanBerdasarkanFilter(tahunSekarang, null, null);
  };
}

// 💡 ENGINE FILTER UTAMA
function renderLaporanBerdasarkanFilter(tahun, tglMulai, tglSelesai) {
  let totalIn = 0;
  let totalOut = 0;
  const arrayBulananIn = Array(12).fill(0);
  const arrayBulananOut = Array(12).fill(0);
  const alokasiKategori = {};

  const fungsiFilter = (item) => {
    if (!item.tanggal) return false;
    const tglOnly = item.tanggal.substring(0, 10);
    const itemTahun = new Date(item.tanggal).getFullYear();

    if (tglMulai && tglSelesai) {
      return tglOnly >= tglMulai && tglOnly <= tglSelesai; // Filter Rentang Tanggal
    } else if (tahun) {
      return itemTahun === parseInt(tahun); // Filter Tahun
    }
    return true; // Jika "Semua Tahun"
  };

  // Hitung Pemasukan yang lolos filter
  cachePemasukan.filter(fungsiFilter).forEach((item) => {
    const nominal = item.nominal || 0;
    totalIn += nominal;
    const bulanIdx = new Date(item.tanggal).getMonth();
    arrayBulananIn[bulanIdx] += nominal;
  });

  // Hitung Pengeluaran yang lolos filter
  cachePengeluaran.filter(fungsiFilter).forEach((item) => {
    const nominal = item.nominal || 0;
    totalOut += nominal;
    const bulanIdx = new Date(item.tanggal).getMonth();
    arrayBulananOut[bulanIdx] += nominal;

    const kat = item.kategori ? item.kategori.trim().toUpperCase() : "LAINNYA";
    alokasiKategori[kat] = (alokasiKategori[kat] || 0) + nominal;
  });

  // Update Teks Label Periode Waktu
  let labelWaktu = "";
  if (tglMulai && tglSelesai) {
    labelWaktu = `${tglMulai} s/d ${tglSelesai}`;
  } else if (tahun) {
    labelWaktu = `Tahun ${tahun}`;
  } else {
    labelWaktu = `Sepanjang Masa`;
  }
  document.getElementById("lblTahunPemasukan").innerText = labelWaktu;
  document.getElementById("lblTahunPengeluaran").innerText = labelWaktu;

  // Suntik Teks Total Angka
  document.getElementById("txtTotalLapIn").innerText = formatRupiah(totalIn);
  document.getElementById("txtTotalLapOut").innerText = formatRupiah(totalOut);

  const selisihBersih = totalIn - totalOut;
  document.getElementById("txtTotalLapNet").innerText =
    formatRupiah(selisihBersih);

  const elBadge = document.getElementById("lblNetBadge");
  if (elBadge) {
    if (selisihBersih >= 0) {
      elBadge.innerText = "↑ Surplus";
      elBadge.className =
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700";
    } else {
      elBadge.innerText = "↓ Defisit";
      elBadge.className =
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-50 text-rose-700";
    }
  }

  // Ringkasan Statistik
  const namaBulanIndo = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  let maxBulanIdx = 0,
    maxBulanVal = 0;
  arrayBulananOut.forEach((val, idx) => {
    if (val > maxBulanVal) {
      maxBulanVal = val;
      maxBulanIdx = idx;
    }
  });
  document.getElementById("lblStatBulanMax").innerText =
    maxBulanVal > 0 ? namaBulanIndo[maxBulanIdx] : "-";

  let maxKategoriNama = "-",
    maxKategoriVal = 0;
  for (const [key, value] of Object.entries(alokasiKategori)) {
    if (value > maxKategoriVal) {
      maxKategoriVal = value;
      maxKategoriNama = key;
    }
  }
  document.getElementById("lblStatKategoriMax").innerText = maxKategoriNama;

  const rataRataPemasukan = Math.round(
    totalIn / (tahun ? 12 : cachePemasukan.length > 0 ? 12 : 1),
  );
  document.getElementById("lblStatAvgIn").innerText =
    formatRupiah(rataRataPemasukan);

  // Render Grafik
  renderGrafikKomparasiBulanan(arrayBulananIn, arrayBulananOut);
  renderGrafikLingkaranDistribusi(alokasiKategori);
}

// 💡 RENDER GRAFIK DENGAN DESTROY INSTANCE
function renderGrafikKomparasiBulanan(dataMasuk, dataKeluar) {
  const ctx = document
    .getElementById("chartPerbandinganBulanan")
    .getContext("2d");

  // Hancurkan grafik lama biar animasi halus dan tidak gltich
  if (barChartInst) barChartInst.destroy();

  barChartInst = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Ags",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ],
      datasets: [
        {
          label: "Pemasukan",
          data: dataMasuk,
          backgroundColor: "#059669",
          borderRadius: 4,
        },
        {
          label: "Pengeluaran",
          data: dataKeluar,
          backgroundColor: "#e11d48",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { family: "Inter", size: 10 } },
        },
        x: {
          title: {
            display: true,
            text: "Bulan",
            font: { family: "Inter", size: 11, weight: "bold" },
            color: "#9ca3af",
          },
          ticks: { font: { family: "Inter", size: 10 } },
        },
      },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            pointStyle: "rectRounded",
            boxWidth: 8,
            boxHeight: 8,
            font: { family: "Inter", size: 11 },
          },
        },
      },
    },
  });
}

function renderGrafikLingkaranDistribusi(objekKategori) {
  const ctx = document.getElementById("chartStrukturGabungan").getContext("2d");

  if (donutChartInst) donutChartInst.destroy();

  const labelsArray = Object.keys(objekKategori);
  const dataArray = Object.values(objekKategori);
  const warnaArray = labelsArray.map((lbl) => ambilGayaWarnaKategori(lbl).bg);
  const totalDana = dataArray.reduce((sum, v) => sum + v, 0);

  const labelsWithPercent = labelsArray.map((lbl, idx) => {
    const persen =
      totalDana > 0 ? Math.round((dataArray[idx] / totalDana) * 100) : 0;
    return `${lbl.toUpperCase()} (${persen}%)`;
  });

  donutChartInst = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels:
        labelsWithPercent.length > 0 ? labelsWithPercent : ["Belum ada data"],
      datasets: [
        {
          data: dataArray.length > 0 ? dataArray : [1],
          backgroundColor: warnaArray.length > 0 ? warnaArray : ["#e5e7eb"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "rectRounded",
            boxWidth: 8,
            boxHeight: 8,
            padding: 14,
            font: { size: 10, family: "Inter" },
          },
        },
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", initHalamanLaporan);
