/**
 * File: js/transaksi.js
 * 💡 FITUR TERBARU: Kalender Dinamis + Kategori Custom DB + Tren MoM + IMMUTABLE LEDGER 24 JAM 🔒 + WARNA HSL HIGH CONTRAST 🎨
 */
import {
  tambahPemasukan,
  getRiwayatPemasukan,
  tambahPengeluaran,
  getRiwayatPengeluaran,
  updatePemasukan,
  deletePemasukan,
  updatePengeluaran,
  deletePengeluaran,
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
  const btnBatalEditTrx = document.getElementById("btnBatalEdit");

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

      const listKategoriAktif = isPemasukan
        ? dbKategori.filter((k) => k.type === "INCOME")
        : dbKategori.filter((k) => k.type === "EXPENSE");

      selectKategori.innerHTML = "";

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

  // 💡 5. GENERATOR WARNA DINAMIS (VERSI HIGH CONTRAST + HSL HASH)
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
    const key = (namaKat || "LAINNYA")
      .toUpperCase()
      .trim()
      .replace(/\s+/g, "_");

    if (mapWarnaKategori[key]) return mapWarnaKategori[key];

    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }

    // 💡 FIX: Kalikan dengan 137.5 (Golden Angle) agar warna selalu melompat jauh!
    const hue = Math.floor(Math.abs(hash) * 137.5) % 360;

    return { bg: `hsl(${hue}, 75%, 45%)`, text: "#ffffff" };
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

  // 💡 Memuat riwayat tabel dengan filter bulan berjalan + MoM Trend Analisis
  async function muatRiwayatTabel() {
    const tbody = document.getElementById("tabelTransaksiBody");
    if (!tbody) return;

    try {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Memuat data transaksi...</td></tr>`;
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
          } else if (itemBulan === bulanLalu && itemTahun === tahunLalu) {
            totalBulanLalu += nominalNilai;
          }
        });
      }

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
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-400">Belum ada riwayat catatan transaksi.</td></tr>`;
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

        // 💡 LOGIKA GEMBOK 24 JAM (IMMUTABLE LEDGER)
        const tglTransaksi = new Date(item.tanggal);
        const waktuSekarang = new Date();
        const selisihJam = (waktuSekarang - tglTransaksi) / (1000 * 60 * 60);
        const isTerkunci = selisihJam > 24;

        let aksiHtml = "";
        if (isTerkunci) {
          aksiHtml = `<span class="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-md border border-gray-200" title="Dikunci permanen (Lebih dari 24 Jam)"><span class="material-symbols-outlined text-[14px]">lock</span></span>`;
        } else {
          aksiHtml = `
            <div class="flex gap-1 items-center justify-end">
              <button type="button" class="btn-edit-trx text-blue-500 hover:text-blue-700 p-1" data-id="${item.id}" data-nominal="${item.nominal}" data-kat="${item.kategori}" data-ket="${item.keterangan}" data-akun="${item.akun}" data-tgl="${item.tanggal.substring(0, 10)}" title="Edit"><span class="material-symbols-outlined text-[16px] block">edit</span></button>
              <button type="button" class="btn-hapus-trx text-rose-500 hover:text-rose-700 p-1" data-id="${item.id}" title="Hapus"><span class="material-symbols-outlined text-[16px] block">delete</span></button>
            </div>
          `;
        }

        tbody.innerHTML += `
          <tr class="border-b hover:bg-gray-50/50 transition-colors bg-white">
              <td class="py-3.5 px-6 text-gray-400 font-mono truncate">${formatWaktuRealtime(item.tanggal)}</td>
              <td class="py-3.5 px-6"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background-color: ${gayaWarna.bg}; color: ${gayaWarna.text}">${item.kategori}</span></td>
              <td class="py-3.5 px-6 font-semibold text-gray-800 break-all whitespace-normal">${renderDeskripsiDenganToggle(item.keterangan, idx)}</td>
              <td class="py-3.5 px-6 text-gray-400 font-semibold uppercase truncate">${item.akun || "-"}</td>
              <td class="py-3.5 px-6 text-right ${warnaTeksJumlah} truncate">${simbolMataUang}${formatRupiah(item.nominal)}</td>
              <td class="py-3.5 px-4 text-right">${aksiHtml}</td>
          </tr>`;
      });

      // 💡 BINDING AKSI TOMBOL EDIT & HAPUS
      document.querySelectorAll(".btn-hapus-trx").forEach((btn) => {
        btn.onclick = async function () {
          if (confirm("Yakin ingin menghapus transaksi ini?")) {
            try {
              const targetId = this.getAttribute("data-id");
              if (isPemasukan) await deletePemasukan(targetId);
              else await deletePengeluaran(targetId);
              await muatRiwayatTabel(); // Refresh UI instan
            } catch (e) {
              alert("❌ Gagal menghapus: " + e.message);
            }
          }
        };
      });

      document.querySelectorAll(".btn-edit-trx").forEach((btn) => {
        btn.onclick = function () {
          // Isi data ke form
          document.getElementById("txtIdTransaksi").value =
            this.getAttribute("data-id");
          document.getElementById("nominal").value =
            this.getAttribute("data-nominal");
          document.getElementById("kategori").value =
            this.getAttribute("data-kat");
          document.getElementById("deskripsi").value =
            this.getAttribute("data-ket");
          document.getElementById("akun").value =
            this.getAttribute("data-akun");
          document.getElementById("tanggalTransaksi").value =
            this.getAttribute("data-tgl");

          // Ubah tombol submit menjadi mode update
          btnSimpan.innerText = "Update Transaksi";
          if (btnBatalEditTrx) btnBatalEditTrx.classList.remove("hidden");

          // Scroll layar ke form secara halus
          formTransaksi.scrollIntoView({ behavior: "smooth", block: "center" });
        };
      });

      renderChartsHalaman(trenMingguan, mapKategoriDinamis);
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Gagal mengambil data dari server.</td></tr>`;
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

  // 💡 AKSI TOMBOL BATAL EDIT
  if (btnBatalEditTrx) {
    btnBatalEditTrx.onclick = () => {
      formTransaksi.reset();
      document.getElementById("txtIdTransaksi").value = "";
      btnSimpan.innerText = isPemasukan
        ? "Simpan Pemasukan"
        : "Simpan Pengeluaran";
      btnBatalEditTrx.classList.add("hidden");
    };
  }

  // 💡 AKSI SUBMIT FORM (CREATE ATAU UPDATE)
  if (formTransaksi) {
    formTransaksi.addEventListener("submit", async (e) => {
      e.preventDefault();

      const idUpdate = document.getElementById("txtIdTransaksi").value;
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

        // Cek mode Update atau Create
        if (idUpdate) {
          if (isPemasukan) await updatePemasukan(idUpdate, payload);
          else await updatePengeluaran(idUpdate, payload);
          alert("🎉 Transaksi berhasil diperbarui!");
        } else {
          if (isPemasukan) await tambahPemasukan(payload);
          else await tambahPengeluaran(payload);
          alert("🎉 Transaksi baru berhasil dicatat!");
        }

        formTransaksi.reset();
        document.getElementById("txtIdTransaksi").value = "";
        btnSimpan.innerText = isPemasukan
          ? "Simpan Pemasukan"
          : "Simpan Pengeluaran";
        if (btnBatalEditTrx) btnBatalEditTrx.classList.add("hidden");

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
        if (!document.getElementById("txtIdTransaksi").value) {
          btnSimpan.innerText = isPemasukan
            ? "Simpan Pemasukan"
            : "Simpan Pengeluaran";
        } else {
          btnSimpan.innerText = "Update Transaksi";
        }
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
