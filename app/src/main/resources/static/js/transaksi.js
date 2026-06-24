/**
 * File: js/transaksi.js
 * Sinkronisasi Pengolahan Data Form & Tabel Output Riwayat + Kalkulasi Kartu Atas
 */
import {
  tambahPemasukan,
  getRiwayatPemasukan,
  tambahPengeluaran,
  getRiwayatPengeluaran,
  requireAuth,
  logout,
} from "./api.js";

// 1. Proteksi keamanan halaman
requireAuth();

document.addEventListener("DOMContentLoaded", () => {
  const pathName = window.location.pathname.toLowerCase();
  const isPemasukan = pathName.includes("pemasukan");

  const formTransaksi = document.getElementById("formTransaksi");
  const inputNominal = document.getElementById("nominal");
  const selectKategori = document.getElementById("kategori");
  const selectAkun = document.getElementById("akun");
  const inputDeskripsi = document.getElementById("deskripsi");
  const btnSimpan = document.getElementById("btnSimpan");
  const btnLogout = document.getElementById("btnLogout");

  // Format Rupiah Utilitas
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka || 0);
  };

  // Format waktu dari LocalDateTime (ISO String) menjadi YYYY-MM-DD HH:MM
  const formatWaktuRealtime = (tanggalStr) => {
    if (!tanggalStr) return "-";
    // Jika formatnya ISO (mengandung 'T')
    if (tanggalStr.includes("T")) {
      const [tgl, jamFull] = tanggalStr.split("T");
      const jamMenit = jamFull ? jamFull.substring(0, 5) : "";
      return jamMenit ? `${tgl} ${jamMenit}` : tgl;
    }
    return tanggalStr;
  };

  // 2. FUNGSI OUTPUT: Mengambil data riwayat dari database dan merendernya ke tabel HTML + Update Kartu Atas
  async function muatRiwayatTabel() {
    const tbody = document.getElementById("tabelTransaksiBody");
    if (!tbody) return;

    try {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Memuat data transaksi...</td></tr>`;

      // Ambil data dari backend berdasarkan jenis halaman aktif
      const dataRiwayat = isPemasukan
        ? await getRiwayatPemasukan()
        : await getRiwayatPengeluaran();

      tbody.innerHTML = ""; // Reset tabel loading

      // ====== LOGIKA HITUNG SALDO KARTU ATAS SECARA DINAMIS ======
      let akumulasiTotal = 0;
      let rataRata = 0;
      let jumlahItem = dataRiwayat ? dataRiwayat.length : 0;

      if (dataRiwayat && jumlahItem > 0) {
        dataRiwayat.forEach((item) => {
          // Tetap pakai item.nominal karena backend melakukan t.setNominal()
          acumulasiTotal += item.nominal || 0;
        });
        rataRata = Math.round(akumulasiTotal / jumlahItem);
      }

      // Suntikkan hasil hitungan ke komponen ID kartu atas masing-masing halaman
      if (isPemasukan) {
        const elTotal = document.getElementById("txtTotalPemasukanBulanIni");
        const elAvg = document.getElementById("txtRataRataPemasukan");
        if (elTotal) elTotal.innerText = formatRupiah(akumulasiTotal);
        if (elAvg) elAvg.innerText = formatRupiah(rataRata);
      } else {
        const elTotal = document.getElementById("txtTotalPengeluaranBulanIni");
        const elAvg = document.getElementById("txtRataRataPengeluaran");
        const elCount = document.getElementById("txtJumlahItemPengeluaran");
        if (elTotal) elTotal.innerText = formatRupiah(akumulasiTotal);
        if (elAvg) elAvg.innerText = formatRupiah(rataRata);
        if (elCount) elCount.innerText = jumlahItem;
      }
      // =========================================================

      if (!dataRiwayat || jumlahItem === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-400">Belum ada riwayat catatan transaksi.</td></tr>`;
        return;
      }

      // Loop data array dari Spring Boot untuk baris tabel
      dataRiwayat.forEach((item) => {
        const warnaTeksJumlah = isPemasukan ? "text-green-600" : "text-red-600";
        const simbolMataUang = isPemasukan ? "+" : "-";

        tbody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50/50 transition-colors">
                        <td class="py-4 px-6 text-gray-700">${formatWaktuRealtime(item.tanggal)}</td>
                        <td class="py-4 px-6">
                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium ${isPemasukan ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}">
                                ${item.kategori}
                            </span>
                        </td>
                        <td class="py-4 px-6 text-gray-700">${item.keterangan || "-"}</td>
                        <td class="py-4 px-6 text-gray-500">${item.akun || "-"}</td>
                        <td class="py-4 px-6 font-semibold ${warnaTeksJumlah}">
                            ${simbolMataUang}${formatRupiah(item.nominal)}
                        </td>
                    </tr>
                `;
      });
    } catch (error) {
      console.error("Gagal memuat tabel:", error);
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Gagal mengambil data dari server.</td></tr>`;
    }
  }

  // 3. FUNGSI INPUT: Mengirim payload JSON baru saat user submit form
  if (formTransaksi) {
    formTransaksi.addEventListener("submit", async (e) => {
      e.preventDefault();

      // SINKRONISASI PAYLOAD GADO-GADO BERSAMA BACKEND (MURNI MENGIKUTI DTO JAVA)
      const payload = {
        amount: parseFloat(inputNominal.value), // Wajib "amount" mengikuti request.getAmount()
        kategori: selectKategori.value,         // Wajib "kategori" mengikuti request.getKategori()
        keterangan: inputDeskripsi.value.trim(),// Wajib "keterangan" mengikuti request.getKeterangan()
        akun: selectAkun.value,                 // Wajib "akun" mengikuti request.getAkun()
        forceSave: false                        // Untuk melewati validasi saldo minus di backend jika diperlukan
      };

      try {
        btnSimpan.disabled = true;
        btnSimpan.innerText = "Menyimpan...";

        if (isPemasukan) {
          await tambahPemasukan(payload);
          alert("🎉 Pemasukan berhasil dicatat!");
        } else {
          await tambahPengeluaran(payload);
          alert("🎉 Pengeluaran berhasil dicatat!");
        }

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

  // 4. LOGOUT EVENT BINDING
  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Apakah Anda yakin ingin keluar dari FinanceBuddy?")) {
        logout();
      }
    });
  }

  // Jalankan penarikan data riwayat saat halaman pertama kali dibuka
  muatRiwayatTabel();
});