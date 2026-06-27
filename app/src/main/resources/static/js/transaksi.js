/**
 * File: js/transaksi.js
 * 💡 FITUR TERBARU: Kalender Dinamis + Kategori Custom DB + Tren vs Bulan Lalu Dinamis
 */
import {
  tambahPemasukan,
  getRiwayatPemasukan,
  tambahPengeluaran,
  getRiwayatPengeluaran,
  getProfil,
  getKategori,
  tambahKategori,
  updateKategori,
  deleteKategori,
  requireAuth,
  logout,
} from "./api.js";

requireAuth();

let lineChartInst = null;
let donutChartInst = null;

document.addEventListener("DOMContentLoaded", async () => {
  const pathName = window.location.pathname.toLowerCase();
  const isPemasukan = pathName.includes("pemasukan");

  const formTransaksi = document.getElementById("formTransaksi");
  const inputNominal = document.getElementById("nominal");
  const selectKategori = document.getElementById("kategori");
  const selectAkun = document.getElementById("akun");
  const inputDeskripsi = document.getElementById("deskripsi");
  const inputTanggal = document.getElementById("tanggalTransaksi");
  const btnSimpan = document.getElementById("btnSimpan");
  const btnLogout = document.getElementById("btnLogout");

  // 1. Set Default Kalender ke Hari Ini secara otomatis saat web diload
  if (inputTanggal) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    inputTanggal.value = `${yyyy}-${mm}-${dd}`;
  }

  // 2. Muat Profil User
  let userPrefix = "guest";
  try {
    const pData = await getProfil();
    if (pData && pData.data && pData.data.email) {
      userPrefix = pData.data.email.replace(/[^a-zA-Z0-9]/g, "_");
    }
  } catch (e) {
    console.error(e);
  }

  // 3. INTEGRASI KATEGORI DINAMIS DARI MYSQL
  try {
    if (selectKategori) {
      const dbKategori = await getKategori();

      // Filter tipe kategori sesuai halaman yang sedang dibuka
      const listKategoriAktif = isPemasukan
        ? dbKategori.filter((k) => k.type === "INCOME")
        : dbKategori.filter((k) => k.type === "EXPENSE");

      selectKategori.innerHTML = ""; // Bersihkan opsi bawaan HTML

      if (listKategoriAktif.length === 0) {
        selectKategori.innerHTML = `<option value="">-- Buat Kategori Dulu --</option>`;
      } else {
        listKategoriAktif.forEach((kat) => {
          selectKategori.innerHTML += `<option value="${kat.name}">${kat.name}</option>`;
        });
      }
    }
  } catch (err) {
    console.error("Gagal memuat data kategori: ", err);
  }

  // 4. Sinkronisasi Pilihan Akun Aktif
  if (selectAkun) {
    const defaultAkun = ["BCA", "MANDIRI", "GOPAY", "DANA", "CASH"];
    const listAkunAktif = JSON.parse(
      localStorage.getItem(`${userPrefix}_fb_daftar_akun_user`) ||
        JSON.stringify(defaultAkun),
    );
    selectAkun.innerHTML = "";
    listAkunAktif.forEach((acc) => {
      const opt = document.createElement("option");
      opt.value = acc.toUpperCase();
      opt.textContent = acc.toUpperCase();
      selectAkun.appendChild(opt);
    });
  }

  // 5. GENERATOR WARNA DINAMIS UNTUK KATEGORI BARU
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

  const warnaCadangan = [
    { bg: "#fef3c7", text: "#6b4e00" }, // Kuning
    { bg: "#e0e7ff", text: "#3730a3" }, // Nila/Indigo
    { bg: "#fce7f3", text: "#9d174d" }, // Pink
    { bg: "#dcfce7", text: "#166534" }, // Hijau Tua
    { bg: "#f3e8ff", text: "#6b21a8" }, // Ungu
    { bg: "#ffedd5", text: "#9a3412" }, // Oranye
  ];

  function ambilGayaWarnaKategori(namaKat) {
    const key = (namaKat || "LAINNYA")
      .toUpperCase()
      .trim()
      .replace(/\s+/g, "_");

    if (mapWarnaKategori[key]) return mapWarnaKategori[key];

    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const indexWarna = Math.abs(hash) % warnaCadangan.length;
    return warnaCadangan[indexWarna];
  }

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka || 0);
  };

  const formatWaktuRealtime = (tanggalStr) => {
    if (!tanggalStr) return "-";
    if (tanggalStr.includes("T")) {
      const [tgl, jamFull] = tanggalStr.split("T");
      const jamMenit = jamFull ? jamFull.substring(0, 5) : "";
      return jamMenit ? `${tgl} ${jamMenit}` : tgl;
    }
    return tanggalStr;
  };

  // 💡 JURUS INTI: Memuat riwayat tabel dengan filter bulan berjalan + MoM Trend Analisis
  async function muatRiwayatTabel() {
    const tbody = document.getElementById("tabelTransaksiBody");
    if (!tbody) return;

    try {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Memuat data transaksi...</td></tr>`;
      const dataRiwayat = isPemasukan
        ? await getRiwayatPemasukan()
        : await getRiwayatPengeluaran();
      tbody.innerHTML = "";

      let totalBulanIni = 0;
      let totalBulanLalu = 0;
      let jumlahItemBulanIni = 0;
      const mapKategoriDinamis = {};
      const trenMingguan = Array(4).fill(0);

      const sekarang = new Date();
      const bulanIni = sekarang.getMonth();
      const tahunIni = sekarang.getFullYear();

      let bulanLalu = bulanIni - 1;
      let tahunLalu = tahunIni;
      if (bulanLalu < 0) {
        bulanLalu = 11;
        tahunLalu--;
      }

      if (dataRiwayat && dataRiwayat.length > 0) {
        dataRiwayat.forEach((item) => {
          const nominalNilai = item.nominal || 0;
          const tglItem = new Date(item.tanggal);
          const itemBulan = tglItem.getMonth();
          const itemTahun = tglItem.getFullYear();

          // Filter data khusus Bulan INI
          if (itemBulan === bulanIni && itemTahun === tahunIni) {
            totalBulanIni += nominalNilai;
            jumlahItemBulanIni++;
            const namaKategoriBersih = item.kategori
              ? item.kategori.trim().toUpperCase()
              : "LAINNYA";
            mapKategoriDinamis[namaKategoriBersih] =
              (mapKategoriDinamis[namaKategoriBersih] || 0) + nominalNilai;

            const hari = tglItem.getDate();
            if (hari <= 7) trenMingguan[0] += nominalNilai;
            else if (hari <= 14) trenMingguan[1] += nominalNilai;
            else if (hari <= 21) trenMingguan[2] += nominalNilai;
            else trenMingguan[3] += nominalNilai;
          }
          // Filter data khusus Bulan LALU
          else if (itemBulan === bulanLalu && itemTahun === tahunLalu) {
            totalBulanLalu += nominalNilai;
          }
        });
      }

      // RUMUS KALKULASI PERSENTASE TREN "VS BULAN LALU"
      let persenTren = 0;
      if (totalBulanLalu > 0) {
        persenTren = ((totalBulanIni - totalBulanLalu) / totalBulanLalu) * 100;
      } else if (totalBulanIni > 0) {
        persenTren = 100;
      }

      const trenDibulatkan = Math.abs(Math.round(persenTren));
      const wadahTren = isPemasukan
        ? document.getElementById("wadahTrenPemasukan")
        : document.getElementById("wadahTrenPengeluaran");
      const ikonTren = isPemasukan
        ? document.getElementById("ikonTrenPemasukan")
        : document.getElementById("ikonTrenPengeluaran");
      const teksTren = isPemasukan
        ? document.getElementById("teksTrenPemasukan")
        : document.getElementById("teksTrenPengeluaran");

      if (wadahTren && ikonTren && teksTren) {
        wadahTren.classList.remove("hidden");
        let warnaKelas = "text-gray-400";

        if (persenTren > 0) {
          teksTren.innerText = `+${trenDibulatkan}%`;
          ikonTren.innerText = "trending_up";
          warnaKelas = isPemasukan ? "text-emerald-500" : "text-rose-500";
        } else if (persenTren < 0) {
          teksTren.innerText = `-${trenDibulatkan}%`;
          ikonTren.innerText = "trending_down";
          warnaKelas = isPemasukan ? "text-rose-500" : "text-emerald-500";
        } else {
          teksTren.innerText = `0%`;
          ikonTren.innerText = "trending_flat";
        }
        ikonTren.className = `material-symbols-outlined text-[16px] ${warnaKelas}`;
        teksTren.className = `text-xs font-bold ${warnaKelas}`;
      }

      const rataRata =
        jumlahItemBulanIni > 0
          ? Math.round(totalBulanIni / jumlahItemBulanIni)
          : 0;

      if (isPemasukan) {
        if (document.getElementById("txtTotalPemasukanBulanIni"))
          document.getElementById("txtTotalPemasukanBulanIni").innerText =
            formatRupiah(totalBulanIni);
        if (document.getElementById("txtRataRataPemasukan"))
          document.getElementById("txtRataRataPemasukan").innerText =
            formatRupiah(Math.round(totalBulanIni / 30));

        const targetTabungan =
          parseInt(localStorage.getItem(`${userPrefix}_target_tabungan`), 10) ||
          parseInt(localStorage.getItem("fb_current_target_tabungan"), 10) ||
          500000;
        const elTargetVal = document.getElementById("lblTargetValue");
        const elTargetPct = document.getElementById("lblTargetPercent");
        const elTargetBar = document.getElementById("barTargetProgress");
        const elTargetRemains = document.getElementById("lblTargetRemains");

        if (elTargetVal) elTargetVal.innerText = formatRupiah(targetTabungan);
        const persenPencapaian = Math.min(
          100,
          Math.round((totalBulanIni / targetTabungan) * 100),
        );
        if (elTargetPct) elTargetPct.innerText = `${persenPencapaian}%`;
        if (elTargetBar) elTargetBar.style.width = `${persenPencapaian}%`;
        if (elTargetRemains) {
          elTargetRemains.innerText =
            totalBulanIni >= targetTabungan
              ? "Target tabungan sukses tercapai! 🎉"
              : `Sisa ${formatRupiah(targetTabungan - totalBulanIni)} untuk mencapai target`;
        }
      } else {
        if (document.getElementById("txtTotalPengeluaranBulanIni"))
          document.getElementById("txtTotalPengeluaranBulanIni").innerText =
            formatRupiah(totalBulanIni);
        if (document.getElementById("txtRataRataPengeluaran"))
          document.getElementById("txtRataRataPengeluaran").innerText =
            formatRupiah(rataRata);
        if (document.getElementById("txtJumlahItemPengeluaran"))
          document.getElementById("txtJumlahItemPengeluaran").innerText =
            jumlahItemBulanIni;

        const elBudget = document.getElementById("lblRemainingBudget");
        const elBar = document.getElementById("barBudget");
        const txtPct = document.getElementById("txtBudgetPercent");

        const limitAnggaran =
          parseInt(localStorage.getItem(`${userPrefix}_limit_anggaran`), 10) ||
          parseInt(localStorage.getItem("fb_current_limit_anggaran"), 10) ||
          1000000;
        const sisaBudget = limitAnggaran - totalBulanIni;

        if (elBudget)
          elBudget.innerText = formatRupiah(Math.max(0, sisaBudget));
        if (elBar) {
          const usedPct = Math.min(
            100,
            Math.round((totalBulanIni / limitAnggaran) * 100),
          );
          elBar.style.width = `${usedPct}%`;
          if (txtPct) txtPct.innerText = `${usedPct}% Used`;
        }
      }

      if (!dataRiwayat || dataRiwayat.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-400">Belum ada riwayat catatan transaksi.</td></tr>`;
        renderChartsHalaman(trenMingguan, mapKategoriDinamis);
        return;
      }

      dataRiwayat.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      dataRiwayat.forEach((item, idx) => {
        const warnaTeksJumlah = isPemasukan
          ? "text-emerald-600 font-bold"
          : "text-rose-600 font-bold";
        const simbolMataUang = isPemasukan ? "+" : "-";
        const gayaWarna = ambilGayaWarnaKategori(item.kategori);

        tbody.innerHTML += `
          <tr class="border-b hover:bg-gray-50/50 transition-colors bg-white">
              <td class="py-3.5 px-6 text-gray-400 font-mono">${formatWaktuRealtime(item.tanggal)}</td>
              <td class="py-3.5 px-6"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background-color: ${gayaWarna.bg}; color: ${gayaWarna.text}">${item.kategori}</span></td>
              <td class="py-3.5 px-6 font-semibold text-gray-800 break-all whitespace-normal">${renderDeskripsiDenganToggle(item.keterangan, idx)}</td>
              <td class="py-3.5 px-6 text-gray-400 font-semibold uppercase">${item.akun || "-"}</td>
              <td class="py-3.5 px-6 text-right ${warnaTeksJumlah}">${simbolMataUang}${formatRupiah(item.nominal)}</td>
          </tr>`;
      });

      renderChartsHalaman(trenMingguan, mapKategoriDinamis);
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Gagal mengambil data dari server.</td></tr>`;
    }
  }

  function renderDeskripsiDenganToggle(keteranganText, idUnik) {
    const ket = keteranganText || "-";
    if (ket.length > 25) {
      return `
        <div class="break-all whitespace-normal text-gray-700">
          <span id="short_${idUnik}">${ket.substring(0, 25)}...</span>
          <span id="full_${idUnik}" class="hidden">${ket}</span>
          <button type="button" class="text-[#366758] font-bold hover:underline block mt-0.5 text-[10px] uppercase tracking-wider" onclick="const s=document.getElementById('short_${idUnik}'); const f=document.getElementById('full_${idUnik}'); if(f.classList.contains('hidden')){ f.classList.remove('hidden'); s.classList.add('hidden'); this.innerText='Sembunyikan'; }else{ f.classList.add('hidden'); s.classList.remove('hidden'); this.innerText='Baca Selengkapnya'; }">Baca Selengkapnya</button>
        </div>`;
    }
    return `<div class="break-all whitespace-normal font-semibold text-gray-800">${ket}</div>`;
  }

  function renderChartsHalaman(arrMingguan, objekKategori) {
    const canvasLine =
      document.getElementById("chartLineIn") ||
      document.getElementById("chartLineOut");
    const canvasDonut =
      document.getElementById("chartDonutIn") ||
      document.getElementById("chartDonutOut");

    if (canvasLine) {
      if (lineChartInst) lineChartInst.destroy();
      lineChartInst = new Chart(canvasLine.getContext("2d"), {
        type: "line",
        data: {
          labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"],
          datasets: [
            {
              label: isPemasukan ? "Dana Masuk" : "Dana Keluar",
              data: arrMingguan,
              borderColor: "#366758",
              tension: 0.3,
              fill: true,
              backgroundColor: "rgba(54,103,88,0.02)",
              pointBackgroundColor: "#366758",
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
                boxWidth: 6,
                boxHeight: 6,
              },
            },
          },
        },
      });
    }

    if (canvasDonut) {
      if (donutChartInst) donutChartInst.destroy();
      const labelsArray = Object.keys(objekKategori);
      const dataArray = Object.values(objekKategori);

      const warnaArray = labelsArray.map(
        (lbl) => ambilGayaWarnaKategori(lbl).bg,
      );
      const totalDanaDonut = dataArray.reduce((sum, val) => sum + val, 0);

      const labelsWithPercent = labelsArray.map((lbl, idx) => {
        const persen =
          totalDanaDonut > 0
            ? Math.round((dataArray[idx] / totalDanaDonut) * 100)
            : 0;
        return `${lbl.toUpperCase()} (${persen}%)`;
      });

      donutChartInst = new Chart(canvasDonut.getContext("2d"), {
        type: "doughnut",
        data: {
          labels:
            labelsWithPercent.length > 0
              ? labelsWithPercent
              : ["Belum ada data"],
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
              position: "right",
              labels: {
                usePointStyle: true,
                pointStyle: "rectRounded",
                boxWidth: 8,
                boxHeight: 8,
                padding: 12,
                font: { size: 11, family: "Inter" },
              },
            },
          },
        },
      });
    }
  }

  if (formTransaksi) {
    formTransaksi.addEventListener("submit", async (e) => {
      e.preventDefault();

      const inputTanggal = document.getElementById("tanggalTransaksi");
      let tglIsoStr = "";

      if (inputTanggal && inputTanggal.value) {
        const sekarang = new Date();
        const jam = String(sekarang.getHours()).padStart(2, "0");
        const menit = String(sekarang.getMinutes()).padStart(2, "0");
        const detik = String(sekarang.getSeconds()).padStart(2, "0");

        tglIsoStr = `${inputTanggal.value}T${jam}:${menit}:${detik}`;
      } else {
        tglIsoStr = new Date().toISOString().substring(0, 19);
      }

      if (!selectKategori.value) {
        alert("❌ Harap buat atau pilih kategori terlebih dahulu!");
        return;
      }

      const payload = {
        nominal: parseFloat(inputNominal.value),
        kategori: selectKategori.value,
        keterangan: inputDeskripsi.value.trim(),
        akun: selectAkun.value,
        tanggal: tglIsoStr,
        forceSave: false,
      };

      try {
        btnSimpan.disabled = true;
        btnSimpan.innerText = "Menyimpan...";
        if (isPemasukan) await tambahPemasukan(payload);
        else await tambahPengeluaran(payload);

        alert("🎉 Transaksi berhasil dicatat!");
        formTransaksi.reset();

        if (inputTanggal) {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, "0");
          const dd = String(today.getDate()).padStart(2, "0");
          inputTanggal.value = `${yyyy}-${mm}-${dd}`;
        }

        await muatRiwayatTabel();
      } catch (error) {
        alert("❌ Gagal menyimpan: " + error.message);
      } finally {
        btnSimpan.disabled = false;
        btnSimpan.innerText = "Simpan";
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Apakah Anda yakin ingin keluar dari FinanceBuddy?")) {
        localStorage.removeItem("fb_current_limit_anggaran");
        localStorage.removeItem("fb_current_target_tabungan");
        logout();
      }
    });
  }

  // 6. SISTEM MANAJER KATEGORI (MODAL POP-UP)
  const modalKategori = document.getElementById("modalKelolaKategori");
  const btnBukaModalKat = document.getElementById("btnBukaModalKategori");
  const btnTutupModalKat = document.getElementById("btnTutupModalKategori");
  const formKategoriModal = document.getElementById("formKategoriModal");
  const listKategoriModal = document.getElementById("listKategoriModal");
  const btnBatalKat = document.getElementById("btnBatalKategoriModal");

  let cacheKategoriBawaan = [];

  async function renderKategoriManager() {
    try {
      if (!selectKategori || !listKategoriModal) return;

      const dbKategori = await getKategori();
      const tipeAktif = isPemasukan ? "INCOME" : "EXPENSE";
      cacheKategoriBawaan = dbKategori.filter((k) => k.type === tipeAktif);

      selectKategori.innerHTML = "";
      if (cacheKategoriBawaan.length === 0) {
        selectKategori.innerHTML = `<option value="">-- Buat Kategori Dulu --</option>`;
      } else {
        cacheKategoriBawaan.forEach((kat) => {
          selectKategori.innerHTML += `<option value="${kat.name}">${kat.name}</option>`;
        });
      }

      listKategoriModal.innerHTML = "";
      cacheKategoriBawaan.forEach((kat) => {
        const isBawaanSistem =
          kat.userId === "admin" || kat.userId === "SYSTEM";

        let aksiTombol = "";
        if (isBawaanSistem) {
          aksiTombol = `<span class="text-[10px] text-gray-400 italic bg-gray-100 px-2 py-0.5 rounded-md">Bawaan</span>`;
        } else {
          aksiTombol = `
            <button type="button" class="btn-edit-kat text-blue-500 hover:text-blue-700 p-1" data-id="${kat.id}" data-name="${kat.name}"><span class="material-symbols-outlined text-[16px] block">edit</span></button>
            <button type="button" class="btn-hapus-kat text-rose-500 hover:text-rose-700 p-1" data-id="${kat.id}"><span class="material-symbols-outlined text-[16px] block">delete</span></button>
          `;
        }

        listKategoriModal.innerHTML += `
          <div class="flex items-center justify-between p-3 bg-white">
            <span class="text-xs font-bold text-gray-700 tracking-wide">${kat.name}</span>
            <div class="flex gap-1 items-center">${aksiTombol}</div>
          </div>
        `;
      });

      document.querySelectorAll(".btn-hapus-kat").forEach((btn) => {
        btn.onclick = async function () {
          if (
            confirm(
              "Hapus kategori ini? Data transaksi tidak akan terhapus, tapi kategorinya mungkin hilang dari grafik.",
            )
          ) {
            try {
              await deleteKategori(this.getAttribute("data-id"));
              await renderKategoriManager();
            } catch (e) {
              alert("❌ " + e.message);
            }
          }
        };
      });

      document.querySelectorAll(".btn-edit-kat").forEach((btn) => {
        btn.onclick = function () {
          document.getElementById("txtIdKategoriModal").value =
            this.getAttribute("data-id");
          document.getElementById("txtNamaKategoriModal").value =
            this.getAttribute("data-name");
          btnBatalKat.classList.remove("hidden");
        };
      });
    } catch (e) {
      console.error("Gagal sinkronisasi kategori:", e);
    }
  }

  if (btnBukaModalKat && modalKategori) {
    btnBukaModalKat.onclick = () => {
      modalKategori.classList.remove("hidden");
      renderKategoriManager();
    };
    btnTutupModalKat.onclick = () => {
      modalKategori.classList.add("hidden");
      formKategoriModal.reset();
      document.getElementById("txtIdKategoriModal").value = "";
      btnBatalKat.classList.add("hidden");
    };
    btnBatalKat.onclick = () => {
      formKategoriModal.reset();
      document.getElementById("txtIdKategoriModal").value = "";
      btnBatalKat.classList.add("hidden");
    };
  }

  if (formKategoriModal) {
    formKategoriModal.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("txtIdKategoriModal").value;
      const nama = document
        .getElementById("txtNamaKategoriModal")
        .value.trim()
        .toUpperCase();
      const tipe = isPemasukan ? "INCOME" : "EXPENSE";

      try {
        if (id) {
          await updateKategori(id, { name: nama, type: tipe });
        } else {
          await tambahKategori({ name: nama, type: tipe });
        }
        formKategoriModal.reset();
        document.getElementById("txtIdKategoriModal").value = "";
        btnBatalKat.classList.add("hidden");

        await renderKategoriManager();
      } catch (err) {
        alert("❌ " + err.message);
      }
    });
  }

  await renderKategoriManager();
  await muatRiwayatTabel();
});
