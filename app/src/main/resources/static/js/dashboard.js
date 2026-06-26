/**
 * File: js/dashboard.js
 * 💡 FIX: Menggabungkan Urutan Saldo Terbesar-Terkecil + Fitur Baca Selengkapnya (Anti-Bentrok)
 */
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
  const hash = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const keys = Object.keys(mapWarnaKategori);
  return mapWarnaKategori[keys[hash % keys.length]];
}

// Fitur memotong deskripsi panjang, wrap kebawah, dan membuat tombol Baca Selengkapnya di Dashboard
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

function dapatkanDaftarAkunAplikasi() {
  const defaultAkun = ["BCA", "MANDIRI", "GOPAY", "DANA", "CASH"];
  const lokalData = localStorage.getItem("fb_daftar_akun_user");
  if (!lokalData) {
    localStorage.setItem("fb_daftar_akun_user", JSON.stringify(defaultAkun));
    return defaultAkun;
  }
  return JSON.parse(lokalData);
}

function simpanDaftarAkunAplikasi(arrayAkun) {
  localStorage.setItem("fb_daftar_akun_user", JSON.stringify(arrayAkun));
}

let cacheSemuaTransaksi = [];
let statusEkspansiPenuh = false;

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
    setupDropdownFilterAkun();
    await ambilDanProsesDataTransaksi();
    setupDashboardEventBindings();
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

  new Chart(document.getElementById("chartKategori"), {
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
          borderRadius: 4,
        },
        {
          label: "Pengeluaran",
          data: summary.grafikBulanan
            ? summary.grafikBulanan.map((i) => i.pengeluaran)
            : [0, 0, 0],
          backgroundColor: "#ffb7b2",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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

function setupDropdownFilterAkun() {
  const selectFilter = document.getElementById("filterDompetAkun");
  if (!selectFilter) return;
  const listAkun = dapatkanDaftarAkunAplikasi();

  selectFilter.innerHTML = `<option value="ALL">Semua Dompet</option>`;
  listAkun.forEach((acc) => {
    selectFilter.innerHTML += `<option value="${acc.toUpperCase()}">${acc.toUpperCase()}</option>`;
  });
}

async function ambilDanProsesDataTransaksi() {
  try {
    const inc = (await getRiwayatPemasukan()) || [];
    const exp = (await getRiwayatPengeluaran()) || [];

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

    // 💡 FIX SORTING DI SINI: Mapping ulang & urutkan saldo terbesar ke terkecil
    let listAkunTerurut = listAkunAktif
      .map((acc) => {
        return {
          nama: acc,
          saldo: dompetAkun[acc.toUpperCase()] || 0,
        };
      })
      .sort((a, b) => b.saldo - a.saldo);

    const containerAkun = document.getElementById("containerAkunDinamis");
    if (containerAkun) {
      containerAkun.innerHTML = "";
      containerAkun.className = `grid gap-3 text-center text-[10px] text-gray-400 font-semibold uppercase ${
        listAkunTerurut.length <= 3
          ? "grid-cols-3"
          : listAkunTerurut.length === 4
            ? "grid-cols-4"
            : "grid-cols-2 sm:grid-cols-5"
      }`;

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
          <td class="py-3.5 px-6 text-gray-400 font-mono">${formatWaktuRealtime(t.tanggal)}</td>
          <td class="py-3.5 px-6 font-semibold text-gray-800">${renderDeskripsiDinamis(t.keterangan, idx, "dash")}</td>
          <td>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background-color: ${gayaWarna.bg}; color: ${gayaWarna.text}">
                  ${t.kategori}
              </span>
          </td>
          <td class="py-3.5 px-6 text-gray-400 font-semibold uppercase">${t.akun || "-"}</td>
          <td class="py-3.5 px-6 text-right ${warnaTeksJumlah}">
              ${simbolMataUang}${formatRp(t.nominal)}
          </td>
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
    const input = document.getElementById("txtNamaAccBaru");
    const inputVal = input
      ? input.value
      : document.getElementById("txtNamaAkunBaru").value;
    const namaBaru = inputVal
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
    if (input) input.value = "";
    else document.getElementById("txtNamaAkunBaru").value = "";
    renderListAkunDiModal();
    setupDropdownFilterAkun();
    ambilDanProsesDataTransaksi();
  };
}

initDashboard();
setupModalAkunManagerLogic();
