/**
 * File: js/dashboard.js
 * 💡 FITUR: Sinkronisasi Akun, Warna Kategori Dinamis HSL & Kalkulasi Tren (MoM)
 * 🚀 PERFORMANCE: Dioptimasi menggunakan Promise.all untuk mencegah API Waterfall
 */
import {
  getDashboardData,
  getRiwayatPemasukan,
  getRiwayatPengeluaran,
  getProfil,
  logout,
  requireAuth,
} from "./api.js";

requireAuth();

const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("Apakah Anda yakin ingin keluar dari FinanceBuddy?")) {
      logout();
    }
  });
}

const formatRp = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v || 0);

const formatWaktuRealtime = (tanggalStr) => {
  if (!tanggalStr) return "-";
  if (tanggalStr.includes("T")) {
    const [tgl, jamFull] = tanggalStr.split("T");
    const jamMenit = jamFull ? jamFull.substring(0, 5) : "";
    return jamMenit ? `${tgl} ${jamMenit}` : tgl;
  }
  return tanggalStr;
};

// 💡 1. PENGHASIL WARNA DINAMIS (VERSI HIGH CONTRAST + HSL)
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

  // 💡 FIX: Kalikan dengan 137.5 (Golden Angle) agar warna selalu melompat jauh!
  const hue = Math.floor(Math.abs(hash) * 137.5) % 360;

  return { bg: `hsl(${hue}, 75%, 45%)`, text: "#ffffff" };
}

function renderDeskripsiDinamis(ket, index, pagePrefix) {
  if (!ket) return "-";
  if (ket.length > 25) {
    const shortText = ket.substring(0, 25);
    const idUnik = `exp_${pagePrefix}_${index}_${Math.floor(Math.random() * 1000)}`;
    return `
      <div class="break-words whitespace-normal normal-case text-gray-700">
        <span id="short_${idUnik}">${shortText}...</span>
        <span id="full_${idUnik}" class="hidden">${getSanitizedText(ket)}</span>
        <button type="button" class="text-[#366758] font-bold hover:underline block mt-0.5 text-[10px] tracking-wide uppercase" onclick="const s=document.getElementById('short_${idUnik}'); const f=document.getElementById('full_${idUnik}'); if(f.classList.contains('hidden')){ f.classList.remove('hidden'); s.classList.add('hidden'); this.innerText='Sembunyikan'; }else{ f.classList.add('hidden'); s.classList.remove('hidden'); this.innerText='Baca Selengkapnya'; }">Baca Selengkapnya</button>
      </div>`;
  }
  return `<div class="break-words whitespace-normal normal-case text-gray-700 font-medium">${ket}</div>`;
}

function getSanitizedText(text) {
  return text.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

let userPrefix = "guest";
function dapatkanDaftarAkunAplikasi() {
  const defaultAkun = ["BCA", "MANDIRI", "GOPAY", "DANA", "CASH"];
  const lokalData = localStorage.getItem(`${userPrefix}_fb_daftar_akun_user`);
  if (!lokalData) {
    localStorage.setItem(
      `${userPrefix}_fb_daftar_akun_user`,
      JSON.stringify(defaultAkun),
    );
    return defaultAkun;
  }
  return JSON.parse(lokalData);
}

function simpanDaftarAkunAplikasi(arrayAkun) {
  localStorage.setItem(
    `${userPrefix}_fb_daftar_akun_user`,
    JSON.stringify(arrayAkun),
  );
}

let cacheSemuaTransaksi = [];
let statusEkspansiPenuh = false;

// 💡 2. Inisialisasi dan Kalkulasi Ulang Saldo Tren
async function initDashboard() {
  try {
    // ── 💡 OPTIMASI UTAMA: TEMBAK SEMUA REQUEST SECARA PARALEL (BARENGAN) ──
    const [p, incData, expData, summary] = await Promise.all([
      getProfil().catch(() => null),
      getRiwayatPemasukan().catch(() => []),
      getRiwayatPengeluaran().catch(() => []),
      getDashboardData().catch(() => ({
        saldo: 0,
        grafikKategori: [],
        grafikBulanan: [],
      })),
    ]);

    if (p && p.data && p.data.email) {
      userPrefix = p.data.email.replace(/[^a-zA-Z0-9]/g, "_");
    }

    // Tarik raw data yang sudah di-fetch paralel untuk kalkulasi MoM Saldo Bulanan
    const inc = incData || [];
    const exp = expData || [];

    let saldoBulanIni = 0;
    let saldoBulanLalu = 0;
    let masukBulanIni = 0;
    let keluarBulanIni = 0;

    const sekarang = new Date();
    const blnIni = sekarang.getMonth();
    const thnIni = sekarang.getFullYear();
    let blnLalu = blnIni - 1;
    let thnLalu = thnIni;
    if (blnLalu < 0) {
      blnLalu = 11;
      thnLalu--;
    }

    const kalkulasiData = (arrData, isIncome) => {
      arrData.forEach((item) => {
        const nominal = item.nominal || 0;
        const dt = new Date(item.tanggal);
        const itemBln = dt.getMonth();
        const itemThn = dt.getFullYear();

        if (itemBln === blnIni && itemThn === thnIni) {
          if (isIncome) masukBulanIni += nominal;
          else keluarBulanIni += nominal;
          saldoBulanIni += isIncome ? nominal : -nominal;
        } else if (itemBln === blnLalu && itemThn === thnLalu) {
          saldoBulanLalu += isIncome ? nominal : -nominal;
        }
      });
    };

    kalkulasiData(inc, true);
    kalkulasiData(exp, false);

    // Render Data Ringkasan ke UI
    document.getElementById("txtTotalPemasukan").innerText =
      formatRp(masukBulanIni);
    document.getElementById("txtTotalPengeluaran").innerText =
      formatRp(keluarBulanIni);

    // Tampilkan Total Saldo Keseluruhan Server dari summary hasil Promise.all
    document.getElementById("txtTotalSaldo").innerText = formatRp(
      summary.saldo,
    );

    // Tampilkan Tren "vs Bulan Lalu"
    const badgeTren = document.getElementById("badgeTrenDashboard");
    const ikonTren = document.getElementById("ikonTrenDashboard");
    const teksTren = document.getElementById("teksTrenDashboard");

    if (badgeTren && ikonTren && teksTren) {
      badgeTren.classList.remove("hidden");
      badgeTren.classList.add("inline-flex");

      let persenTren = 0;
      if (saldoBulanLalu !== 0) {
        persenTren =
          ((saldoBulanIni - saldoBulanLalu) / Math.abs(saldoBulanLalu)) * 100;
      } else if (saldoBulanIni !== 0) {
        persenTren = 100;
      }

      const trenBulat = Math.abs(Math.round(persenTren));

      if (persenTren > 0) {
        teksTren.innerText = `+${trenBulat}% vs bulan lalu`;
        ikonTren.innerText = "trending_up";
        badgeTren.className =
          "inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2";
      } else if (persenTren < 0) {
        teksTren.innerText = `-${trenBulat}% vs bulan lalu`;
        ikonTren.innerText = "trending_down";
        badgeTren.className =
          "inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full mt-2";
      } else {
        teksTren.innerText = `Sama dengan bulan lalu`;
        ikonTren.innerText = "trending_flat";
        badgeTren.className =
          "inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-2";
      }
    }

    renderCharts(summary);
    setupDropdownFilterAkun();

    // Pass raw data ke fungsi proses tabel biar gak narik API dua kali
    await ambilDanProsesDataTransaksi(inc, exp);
    setupDashboardEventBindings();
    setupModalAkunManagerLogic();
  } catch (err) {
    console.error(err);
  }
}

function renderCharts(summary) {
  const listLabelDonat = summary.grafikKategori
    ? summary.grafikKategori.map((i) => i.kategori)
    : [];
  const dataValues = summary.grafikKategori
    ? summary.grafikKategori.map((i) => i.jumlah)
    : [];

  const listWarnaDonat = listLabelDonat.map(
    (kat) => ambilGayaWarnaKategori(kat).bg,
  );
  const totalDanaDonut = dataValues.reduce((sum, val) => sum + val, 0);

  const labelsWithPercent = listLabelDonat.map((lbl, idx) => {
    const persen =
      totalDanaDonut > 0
        ? Math.round((dataValues[idx] / totalDanaDonut) * 100)
        : 0;
    return `${lbl.toUpperCase()} (${persen}%)`;
  });

  const domChartKat = document.getElementById("chartKategori");
  if (domChartKat) {
    new Chart(domChartKat, {
      type: "doughnut",
      data: {
        labels:
          labelsWithPercent.length > 0 ? labelsWithPercent : ["Belum ada data"],
        datasets: [
          {
            data: dataValues.length > 0 ? dataValues : [1],
            backgroundColor:
              listWarnaDonat.length > 0 ? listWarnaDonat : ["#e5e7eb"],
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
            },
          },
        },
      },
    });
  }

  const domChartTren = document.getElementById("chartTren");
  if (domChartTren) {
    new Chart(domChartTren, {
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
            backgroundColor: "#059669",
            borderRadius: 4,
          },
          {
            label: "Pengeluaran",
            data: summary.grafikBulanan
              ? summary.grafikBulanan.map((i) => i.pengeluaran)
              : [0, 0, 0],
            backgroundColor: "#e11d48",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "Bulan",
              font: { family: "Inter", size: 11, weight: "bold" },
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              usePointStyle: true,
              pointStyle: "rectRounded",
              boxWidth: 8,
              boxHeight: 8,
            },
          },
        },
      },
    });
  }
}

function setupDropdownFilterAkun() {
  const selectFilter = document.getElementById("filterDompetAkun");
  if (!selectFilter) return;
  const listAkun = dapatkanDaftarAkunAplikasi();
  selectFilter.innerHTML = `<option value="ALL">Semua Dompet</option>`;
  listAkun.forEach((acc) => {
    selectFilter.innerHTML += `<option value="${acc.toUpperCase()}">${acc.toUpperCase()}</option>`;
  });
}

// 💡 3. Terima raw data langsung dari atas biar hemat request
async function ambilDanProsesDataTransaksi(incData, expData) {
  try {
    const inc = incData || (await getRiwayatPemasukan()) || [];
    const exp = expData || (await getRiwayatPengeluaran()) || [];

    const listAkunAktif = dapatkanDaftarAkunAplikasi();
    const dompetAkun = {};
    listAkunAktif.forEach((acc) => {
      dompetAkun[acc.toUpperCase()] = 0;
    });

    cacheSemuaTransaksi = [
      ...inc.map((i) => ({ ...i, jenis: "INCOME" })),
      ...exp.map((e) => ({ ...e, jenis: "EXPENSE" })),
    ];

    cacheSemuaTransaksi.forEach((t) => {
      const namaAkunKey = (t.akun || "CASH").toUpperCase();
      if (dompetAkun[namaAkunKey] !== undefined) {
        if (t.jenis === "INCOME") dompetAkun[namaAkunKey] += t.nominal || 0;
        else dompetAkun[namaAkunKey] -= t.nominal || 0;
      }
    });

    let listAkunTerurut = listAkunAktif
      .map((acc) => {
        return { nama: acc, saldo: dompetAkun[acc.toUpperCase()] || 0 };
      })
      .sort((a, b) => b.saldo - a.saldo);

    const containerAkun = document.getElementById("containerAkunDinamis");
    if (containerAkun) {
      containerAkun.innerHTML = "";
      containerAkun.className = `grid gap-3 text-center text-[10px] text-gray-400 font-semibold uppercase ${listAkunTerurut.length <= 3 ? "grid-cols-3" : listAkunTerurut.length === 4 ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-5"}`;
      listAkunTerurut.forEach((item) => {
        containerAkun.innerHTML += `
          <div class="bg-gray-50/50 p-2 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center min-h-[50px]">
            <p class="tracking-wider text-gray-400 font-bold">${item.nama}</p>
            <p class="text-xs font-bold text-gray-700 mt-0.5">${formatRp(item.saldo)}</p>
          </div>`;
      });
    }

    cacheSemuaTransaksi.sort(
      (a, b) => new Date(b.tanggal) - new Date(a.tanggal),
    );
    renderTabelDinamisDashboard();
  } catch (e) {
    console.error(e);
  }
}

function renderTabelDinamisDashboard() {
  const tbody = document.getElementById("listTransaksiTerakhir");
  if (!tbody) return;

  const filterJenis = document.getElementById("filterJenisKas").value;
  const filterAkun = document.getElementById("filterDompetAkun").value;

  let hasilFilter = cacheSemuaTransaksi.filter((t) => {
    const cocokJenis = filterJenis === "ALL" || t.jenis === filterJenis;
    const cocokAkun =
      filterAkun === "ALL" || (t.akun || "CASH").toUpperCase() === filterAkun;
    return cocokJenis && cocokAkun;
  });

  if (hasilFilter.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400">Tidak ada transaksi yang cocok dengan filter.</td></tr>`;
    return;
  }

  let batasTampil = statusEkspansiPenuh ? hasilFilter.length : 4;
  let itemsTampil = hasilFilter.slice(0, batasTampil);

  tbody.innerHTML = "";
  itemsTampil.forEach((t, idx) => {
    const isInc = t.jenis === "INCOME";
    const gayaWarna = ambilGayaWarnaKategori(t.kategori);
    const warnaTeksJumlah = isInc
      ? "text-emerald-600 font-bold"
      : "text-gray-900 font-medium";
    const simbolMataUang = isInc ? "+" : "-";

    tbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50/50 transition-colors bg-white">
          <td class="py-3.5 px-6 text-gray-400 font-mono truncate">${formatWaktuRealtime(t.tanggal)}</td>
          <td class="py-3.5 px-6 font-semibold text-gray-800">${renderDeskripsiDinamis(t.keterangan, idx, "dash")}</td>
          <td><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background-color: ${gayaWarna.bg}; color: ${gayaWarna.text}">${t.kategori}</span></td>
          <td class="py-3.5 px-6 text-gray-400 font-semibold uppercase truncate">${t.akun || "-"}</td>
          <td class="py-3.5 px-6 text-right ${warnaTeksJumlah} truncate">${simbolMataUang}${formatRp(t.nominal)}</td>
      </tr>`;
  });

  const txtBtn = document.getElementById("txtBtnEkspansi");
  const iconBtn = document.getElementById("iconBtnEkspansi");
  if (txtBtn && iconBtn) {
    if (statusEkspansiPenuh) {
      txtBtn.innerText = "Sembunyikan Transaksi";
      iconBtn.style.transform = "rotate(180deg)";
    } else {
      txtBtn.innerText = "Tampilkan Lebih Banyak";
      iconBtn.style.transform = "rotate(0deg)";
    }
  }
}

function setupDashboardEventBindings() {
  document.getElementById("filterJenisKas").onchange = () =>
    renderTabelDinamisDashboard();
  document.getElementById("filterDompetAkun").onchange = () =>
    renderTabelDinamisDashboard();
  const btnEkspansi = document.getElementById("btnEkspansiTransaksi");
  if (btnEkspansi) {
    btnEkspansi.onclick = () => {
      statusEkspansiPenuh = !statusEkspansiPenuh;
      renderTabelDinamisDashboard();
    };
  }
}

function setupModalAkunManagerLogic() {
  const modal = document.getElementById("modalKelolaAkun");
  const btnBuka = document.getElementById("btnBukaModalAkun");
  const btnTutup = document.getElementById("btnTutupModalAkun");
  const formTambah = document.getElementById("formTambahAkunBaru");
  const listContainer = document.getElementById("listAkunManager");

  if (!modal || !btnBuka) return;

  function renderListAkunDiModal() {
    const list = dapatkanDaftarAkunAplikasi();
    if (!listContainer) return;
    listContainer.innerHTML = "";
    list.forEach((acc) => {
      listContainer.innerHTML += `
        <div class="flex items-center justify-between py-2 text-xs font-semibold text-gray-700">
          <span class="font-mono bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 uppercase">${acc}</span>
          <button class="btn-hapus-akun text-rose-500 hover:text-rose-700 font-bold flex items-center gap-0.5" data-akun="${acc}">
            <span class="material-symbols-outlined text-[16px]">delete</span> Hapus
          </button>
        </div>`;
    });

    document.querySelectorAll(".btn-hapus-akun").forEach((btn) => {
      btn.onclick = function () {
        const targetHapus = this.getAttribute("data-akun");
        let listSekarang = dapatkanDaftarAkunAplikasi();
        if (listSekarang.length <= 1) {
          return alert("❌ Minimal sisakan 1 akun aktif!");
        }
        if (confirm(`Hapus dompet ${targetHapus}?`)) {
          listSekarang = listSekarang.filter(
            (a) => a.toUpperCase() !== targetHapus.toUpperCase(),
          );
          simpanDaftarAkunAplikasi(listSekarang);
          renderListAkunDiModal();
          setupDropdownFilterAkun();
          ambilDanProsesDataTransaksi();
        }
      };
    });
  }

  btnBuka.onclick = () => {
    modal.classList.remove("hidden");
    renderListAkunDiModal();
  };
  btnTutup.onclick = () => {
    modal.classList.add("hidden");
  };
  formTambah.onsubmit = function (e) {
    e.preventDefault();
    const input = document.getElementById("txtNamaAkunBaru");
    const namaBaru = input.value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (!namaBaru) return;
    let listSekarang = dapatkanDaftarAkunAplikasi();
    if (listSekarang.map((a) => a.toUpperCase()).includes(namaBaru)) {
      return alert("❌ Akun sudah ada!");
    }
    listSekarang.push(namaBaru);
    simpanDaftarAkunAplikasi(listSekarang);
    input.value = "";
    renderListAkunDiModal();
    setupDropdownFilterAkun();
    ambilDanProsesDataTransaksi();
  };
}

initDashboard();
