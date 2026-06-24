import {
  getDashboardData,
  getRiwayatPemasukan,
  getRiwayatPengeluaran,
  logout,
  requireAuth,
} from "./api.js";

requireAuth();

document.getElementById("btnLogout").addEventListener("click", logout);

const formatRp = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v || 0);

const formatWaktuRealtime = (tanggalStr) => {
  if (!tanggalStr) return "-";
  const [tgl, jamFull] = tanggalStr.split("T");
  const jamMenit = jamFull ? jamFull.substring(0, 5) : "";
  return jamMenit ? `${tgl} ${jamMenit}` : tgl;
};

async function initDashboard() {
  try {
    const summary = await getDashboardData();
    document.getElementById("txtTotalSaldo").innerText = formatRp(
      summary.saldo,
    );
    document.getElementById("txtTotalPemasukan").innerText = formatRp(
      summary.totalPemasukan,
    );
    document.getElementById("txtTotalPengeluaran").innerText = formatRp(
      summary.totalPengeluaran,
    );

    renderCharts(summary);
    await muatTabelTerakhir();
  } catch (err) {
    console.error(err);
  }
}

function renderCharts(summary) {
  // 1. Doughnut Chart Kategori
  new Chart(document.getElementById("chartKategori"), {
    type: "doughnut",
    data: {
      labels: summary.grafikKategori
        ? summary.grafikKategori.map((i) => i.kategori)
        : ["Belum ada data"],
      datasets: [
        {
          data: summary.grafikKategori
            ? summary.grafikKategori.map((i) => i.jumlah)
            : [100],
          backgroundColor: ["#b5ead7", "#b7e7f7", "#d7defa", "#fef3c7"],
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });

  // 2. Bar Chart Tren Mutasi
  new Chart(document.getElementById("chartTren"), {
    type: "bar",
    data: {
      labels: summary.grafikBulanan
        ? summary.grafikBulanan.map((i) => i.bulan)
        : ["Sep", "Okt", "Nov"],
      datasets: [
        {
          label: "Pemasukan",
          data: summary.grafikBulanan
            ? summary.grafikBulanan.map((i) => i.pemasukan)
            : [0, 0, 0],
          backgroundColor: "#b5ead7",
        },
        {
          label: "Pengeluaran",
          data: summary.grafikBulanan
            ? summary.grafikBulanan.map((i) => i.pengeluaran)
            : [0, 0, 0],
          backgroundColor: "#ffdad6",
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

async function muatTabelTerakhir() {
  const tbody = document.getElementById("listTransaksiTerakhir");
  try {
    const inc = (await getRiwayatPemasukan()) || [];
    const exp = (await getRiwayatPengeluaran()) || [];

    // Gabungkan mutasi dan urutkan berdasarkan tanggal terbaru
    let gabungan = [
      ...inc.map((i) => ({ ...i, jenis: "INCOME" })),
      ...exp.map((e) => ({ ...e, jenis: "EXPENSE" })),
    ]
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      .slice(0, 4);

    tbody.innerHTML = "";
    gabungan.forEach((t) => {
      const isInc = t.jenis === "INCOME";
      tbody.innerHTML += `
                <tr class="border-b hover:bg-gray-50/50">
                    <td class="py-3 px-6 text-gray-600">${t.tanggal}</td>
                    <td class="py-3 px-6 font-medium">${t.keterangan}</td>
                    <td class="py-3 px-6"><span class="px-2 py-0.5 rounded-full text-xs ${isInc ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}">${t.kategori}</span></td>
                    <td class="py-3 px-6 text-gray-500">${t.akun}</td>
                    <td class="py-3 px-6 font-semibold ${isInc ? "text-green-600" : "text-red-600"}">${isInc ? "+" : "-"}${formatRp(t.nominal)}</td>
                </tr>`;
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Gagal memuat mutasi transaksi.</td></tr>`;
  }
}

initDashboard();
