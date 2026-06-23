import { getLaporanTahunan, requireAuth } from "./api.js";

requireAuth();

const formatRupiah = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v || 0);

async function initLaporan() {
  try {
    const tahunSekarang = new Date().getFullYear();
    const data = await getLaporanTahunan(tahunSekarang);

    document.getElementById("lblTotalIncome").innerText = formatRupiah(
      data.totalPemasukan,
    );
    document.getElementById("lblTotalExpense").innerText = formatRupiah(
      data.totalPengeluaran,
    );
    document.getElementById("lblNetSavings").innerText = formatRupiah(
      data.totalPemasukan - data.totalPengeluaran,
    );
    document.getElementById("lblAvgIncome").innerText = formatRupiah(
      data.totalPemasukan / 12,
    );

    // Render Grafik Histogram Batang Multibulanan (Jan - Des)
    new Chart(document.getElementById("chartBatangLaporan"), {
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
          "Agu",
          "Sep",
          "Okt",
          "Nov",
          "Des",
        ],
        datasets: [
          {
            label: "Pemasukan",
            data: data.arrayPemasukanBulanan || Array(12).fill(0),
            backgroundColor: "#b5ead7",
          },
          {
            label: "Pengeluaran",
            data: data.arrayPengeluaranBulanan || Array(12).fill(0),
            backgroundColor: "#ffdad6",
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });

    // Render Grafik Lingkaran Alokasi Pengeluaran
    new Chart(document.getElementById("chartDonatTahunan"), {
      type: "doughnut",
      data: {
        labels: data.distribusiKategori
          ? data.distribusiKategori.map((i) => i.kategori)
          : ["Makanan", "Transport", "Belajar", "Kost"],
        datasets: [
          {
            data: data.distribusiKategori
              ? data.distribusiKategori.map((i) => i.jumlah)
              : [40, 25, 15, 20],
            backgroundColor: ["#b7e7f7", "#d7defa", "#bfc6e1", "#ffdad6"],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  } catch (err) {
    console.error("Gagal memuat rekap laporan:", err);
  }
}

initLaporan();
