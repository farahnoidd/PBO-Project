/**
 * File: js/laporan.js
 * Engine Pengolah Jurnal Laporan Gabungan & Statistik Keuangan
 * 💡 FIX FIGMA: Perbandingan multi-bar Jan-Des, Donut dengan Persen, dan Panel Statistik Riil
 */
import {
  getRiwayatPemasukan,
  getRiwayatPengeluaran,
  requireAuth,
  logout,
} from "./api.js";

requireAuth();

document.getElementById("btnLogout").addEventListener("click", logout);

const btnCetak = document.getElementById("btnCetakLaporan");
if (btnCetak) {
  btnCetak.onclick = () => {
    window.print();
  };
}

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka || 0);
};

const mapWarnaKategori = {
  BONUS: { bg: "#c7ebd9", text: "#133a2e" },
  UANG_SAKU: { bg: "#b5ead7", text: "#164436" },
  GAJI_PART_TIME: { bg: "#b7e7f7", text: "#1a4b61" },
  FREELANCE: { bg: "#d7defa", text: "#2a3661" },
  MAKANAN: { bg: "#ffb7b2", text: "#7a201c" },
  MAKAN: { bg: "#ffb7b2", text: "#7a201c" },
  TRANSPORT: { bg: "#ffdac1", text: "#7d421b" },
  BELAJAR: { bg: "#e2f0cb", text: "#3d521d" },
  KOST: { bg: "#ffccd5", text: "#801f30" },
  HIBURAN: { bg: "#fef3c7", text: "#6b4e00" },
};

function ambilGayaWarnaKategori(namaKat) {
  const key = (namaKat || "LAINNYA").toUpperCase().trim().replace(/\s+/g, "_");
  if (mapWarnaKategori[key]) return mapWarnaKategori[key];
  return { bg: "#f3f4f6", text: "#374151" };
}

async function initHalamanLaporan() {
  try {
    const dataPemasukan = (await getRiwayatPemasukan()) || [];
    const dataPengeluaran = (await getRiwayatPengeluaran()) || [];

    let totalIn = 0;
    let totalOut = 0;

    // Wadah penampung akumulasi 12 bulan (Jan - Des)
    const arrayBulananIn = Array(12).fill(0);
    const arrayBulananOut = Array(12).fill(0);
    const alokasiKategori = {};

    // Proses data Pemasukan
    dataPemasukan.forEach((item) => {
      const nominal = item.nominal || 0;
      totalIn += nominal;
      if (item.tanggal) {
        const bulanIdx = new Date(item.tanggal).getMonth(); // 0 = Jan, 11 = Des
        if (bulanIdx >= 0 && bulanIdx < 12) {
          arrayBulananIn[bulanIdx] += nominal;
        }
      }
    });

    // Proses data Pengeluaran
    dataPengeluaran.forEach((item) => {
      const nominal = item.nominal || 0;
      totalOut += nominal;
      if (item.tanggal) {
        const bulanIdx = new Date(item.tanggal).getMonth();
        if (bulanIdx >= 0 && bulanIdx < 12) {
          arrayBulananOut[bulanIdx] += nominal;
        }
      }
      const kat = item.kategori
        ? item.kategori.trim().toUpperCase()
        : "LAINNYA";
      alokasiKategori[kat] = (alokasiKategori[kat] || 0) + nominal;
    });

    // Suntik data angka ke kartu atas
    document.getElementById("txtTotalLapIn").innerText = formatRupiah(totalIn);
    document.getElementById("txtTotalLapOut").innerText =
      formatRupiah(totalOut);

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

    // Set nama tahun otomatis berdasarkan tanggal data terakhir
    const tahunSekarang = new Date().getFullYear();
    document.getElementById("lblTahunPemasukan").innerText =
      `Tahun ${tahunSekarang}`;
    document.getElementById("lblTahunPengeluaran").innerText =
      `Tahun ${tahunSekarang}`;

    // ====== HITUNG KELUARAN PANEL RINGKASAN STATISTIK ======
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

    // 1. Cari bulan pengeluaran tertinggi
    let maxBulanIdx = 0;
    let maxBulanVal = 0;
    arrayBulananOut.forEach((val, idx) => {
      if (val > maxBulanVal) {
        maxBulanVal = val;
        maxBulanIdx = idx;
      }
    });
    document.getElementById("lblStatBulanMax").innerText =
      maxBulanVal > 0 ? namaBulanIndo[maxBulanIdx] : "-";

    // 2. Cari kategori pengeluaran terbesar
    let maxKategoriNama = "-";
    let maxKategoriVal = 0;
    for (const [key, value] of Object.entries(alokasiKategori)) {
      if (value > maxKategoriVal) {
        maxKategoriVal = value;
        maxKategoriNama = key;
      }
    }
    document.getElementById("lblStatKategoriMax").innerText = maxKategoriNama;

    // 3. Hitung rata-rata pemasukan bulanan riil (total dibagi 12 bulan)
    const rataRataPemasukan = Math.round(totalIn / 12);
    document.getElementById("lblStatAvgIn").innerText =
      formatRupiah(rataRataPemasukan);

    // Render grafik visualisasi
    renderGrafikKomparasiBulanan(arrayBulananIn, arrayBulananOut);
    renderGrafikLingkaranDistribusi(alokasiKategori);
  } catch (error) {
    console.error("Gagal memuat modul laporan tahunan:", error);
  }
}

function renderGrafikKomparasiBulanan(dataMasuk, dataKeluar) {
  const ctx = document
    .getElementById("chartPerbandinganBulanan")
    .getContext("2d");
  new Chart(ctx, {
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
          backgroundColor: "#b5ead7",
          borderRadius: 4,
        },
        {
          label: "Pengeluaran",
          data: dataKeluar,
          backgroundColor: "#ffb7b2",
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
        x: { ticks: { font: { family: "Inter", size: 10 } } },
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

  const labelsArray = Object.keys(objekKategori);
  const dataArray = Object.values(objekKategori);
  const warnaArray = labelsArray.map((lbl) => ambilGayaWarnaKategori(lbl).bg);
  const totalDana = dataArray.reduce((sum, v) => sum + v, 0);

  const labelsWithPercent = labelsArray.map((lbl, idx) => {
    const persen =
      totalDana > 0 ? Math.round((dataArray[idx] / totalDana) * 100) : 0;
    return `${lbl.toUpperCase()} (${persen}%)`;
  });

  new Chart(ctx, {
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
          position: "bottom", // Legenda ditaruh di bawah manis sesuai mockup distribusi tahunan figma
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
