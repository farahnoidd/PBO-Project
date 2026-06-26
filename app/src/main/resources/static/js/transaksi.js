import {
  tambahPemasukan,
  getRiwayatPemasukan,
  tambahPengeluaran,
  getRiwayatPengeluaran,
  getProfil,
  requireAuth,
  logout,
} from "./api.js";

// Proteksi halaman login
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
  const btnSimpan = document.getElementById("btnSimpan");
  const btnLogout = document.getElementById("btnLogout");

  // 💡 FIX PREFIX: Membaca properti pData.data.email sesuai struktur ApiResponse Spring Boot kelompokmu
  let userPrefix = "guest";
  try {
    const pData = await getProfil();
    if (pData && pData.data && pData.data.email) {
      userPrefix = pData.data.email.replace(/[^a-zA-Z0-9]/g, "_");
    }
  } catch (e) {
    console.error(e);
  }

  // Sinkronisasi Pilihan Akun Aktif dari Dashboard lokal memori per user session
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
    const key = (namaKat || "LAINNYA")
      .toUpperCase()
      .trim()
      .replace(/\s+/g, "_");
    if (mapWarnaKategori[key]) return mapWarnaKategori[key];
    return { bg: "#f3f4f6", text: "#374151" };
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

  async function muatRiwayatTabel() {
    const tbody = document.getElementById("tabelTransaksiBody");
    if (!tbody) return;

    try {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Memuat data transaksi...</td></tr>`;
      const dataRiwayat = isPemasukan
        ? await getRiwayatPemasukan()
        : await getRiwayatPengeluaran();
      tbody.innerHTML = "";

      let akumulasiTotal = 0;
      let rataRata = 0;
      let jumlahItem = dataRiwayat ? dataRiwayat.length : 0;
      const mapKategoriDinamis = {};
      const trenMingguan = Array(4).fill(0);

      if (dataRiwayat && jumlahItem > 0) {
        dataRiwayat.forEach((item) => {
          const nominalNilai = item.nominal || 0;
          akumulasiTotal += nominalNilai;
          const namaKategoriBersih = item.kategori
            ? item.kategori.trim().toUpperCase()
            : "LAINNYA";
          mapKategoriDinamis[namaKategoriBersih] =
            (mapKategoriDinamis[namaKategoriBersih] || 0) + nominalNilai;

          if (item.tanggal) {
            const hari = new Date(item.tanggal).getDate();
            if (hari <= 7) trenMingguan[0] += nominalNilai;
            else if (hari <= 14) trenMingguan[1] += nominalNilai;
            else if (hari <= 21) trenMingguan[2] += nominalNilai;
            else trenMingguan[3] += nominalNilai;
          }
        });
        rataRata = Math.round(akumulasiTotal / jumlahItem);
      }

      if (isPemasukan) {
        if (document.getElementById("txtTotalPemasukanBulanIni"))
          document.getElementById("txtTotalPemasukanBulanIni").innerText =
            formatRupiah(akumulasiTotal);
        if (document.getElementById("txtRataRataPemasukan"))
          document.getElementById("txtRataRataPemasukan").innerText =
            formatRupiah(Math.round(akumulasiTotal / 30));

        // 💡 FIX SINKRONISASI: Cek key userPrefix dulu, kalau belum ke-load jalankan key global backup
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
          Math.round((akumulasiTotal / targetTabungan) * 100),
        );
        if (elTargetPct) elTargetPct.innerText = `${persenPencapaian}%`;
        if (elTargetBar) elTargetBar.style.width = `${persenPencapaian}%`;
        if (elTargetRemains) {
          elTargetRemains.innerText =
            akumulasiTotal >= targetTabungan
              ? "Target tabungan bulan ini sukses tercapai! 🎉"
              : `Sisa ${formatRupiah(targetTabungan - akumulasiTotal)} untuk mencapai target`;
        }
      } else {
        if (document.getElementById("txtTotalPengeluaranBulanIni"))
          document.getElementById("txtTotalPengeluaranBulanIni").innerText =
            formatRupiah(akumulasiTotal);
        if (document.getElementById("txtRataRataPengeluaran"))
          document.getElementById("txtRataRataPengeluaran").innerText =
            formatRupiah(rataRata);
        if (document.getElementById("txtJumlahItemPengeluaran"))
          document.getElementById("txtJumlahItemPengeluaran").innerText =
            jumlahItem;

        const elBudget = document.getElementById("lblRemainingBudget");
        const elBar = document.getElementById("barBudget");
        const txtPct = document.getElementById("txtBudgetPercent");

        // 💡 FIX SINKRONISASI: Cek key userPrefix dulu, kalau belum ke-load jalankan key global backup
        const limitAnggaran =
          parseInt(localStorage.getItem(`${userPrefix}_limit_anggaran`), 10) ||
          parseInt(localStorage.getItem("fb_current_limit_anggaran"), 10) ||
          1000000;
        const sisaBudget = limitAnggaran - akumulasiTotal;

        if (elBudget)
          elBudget.innerText = formatRupiah(Math.max(0, sisaBudget));
        if (elBar) {
          const usedPct = Math.min(
            100,
            Math.round((akumulasiTotal / limitAnggaran) * 100),
          );
          elBar.style.width = `${usedPct}%`;
          if (txtPct) txtPct.innerText = `${usedPct}% Used`;
        }
      }

      if (!dataRiwayat || jumlahItem === 0) {
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
      console.error(error);
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
      const tglIsoStr = new Date().toISOString().substring(0, 10) + "T12:00:00";
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
      if (confirm("Apakah Anda yakin ingin keluar dari FinanceBuddy?"))
        logout();
    });
  }

  await muatRiwayatTabel();
});
