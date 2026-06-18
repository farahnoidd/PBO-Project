/**
 * File: transaksi.js
 * Fungsi: Menangani interaktivitas, validasi input form, dan konversi JSON untuk Transaksi.
 */

// 1. IMPORT fungsi dari api.js
import { tambahPemasukan, tambahPengeluaran, requireAuth } from './api.js';

// 2. PROTEKSI HALAMAN: Pastikan user sudah login sebelum bisa input transaksi
requireAuth();

document.addEventListener('DOMContentLoaded', () => {
    // 1. Deteksi halaman yang sedang aktif berdasarkan URL
    const pathName = window.location.pathname.toLowerCase();
    const isPemasukan = pathName.includes('pemasukan');
    const isPengeluaran = pathName.includes('pengeluaran');

    // 2. Tangkap elemen form 
    const formTransaksi = document.getElementById('formTransaksi');
    const inputNominal = document.getElementById('nominal');
    const inputDeskripsi = document.getElementById('deskripsi');
    const selectKategori = document.getElementById('kategori');
    const selectAkun = document.getElementById('akun');

    if (formTransaksi) {
        // PERUBAHAN: Jadikan fungsi callback event listener sebagai 'async'
        formTransaksi.addEventListener('submit', async function (e) {
            e.preventDefault(); 

            // 3. Ambil dan bersihkan nilai input
            const rawNominal = inputNominal.value ? inputNominal.value.replace(/[^0-9]/g, '') : '0';
            const nominal = parseInt(rawNominal, 10);
            
            const deskripsi = inputDeskripsi.value.trim();
            const kategori = selectKategori.value;
            const akun = selectAkun ? selectAkun.value : '';

            // 4. Proses Validasi (Frontend Guard)
            if (isNaN(nominal) || nominal <= 0) {
                alert('Peringatan: Nominal harus berupa angka dan lebih dari 0.');
                return;
            }

            if (deskripsi === '') {
                alert('Peringatan: Deskripsi transaksi tidak boleh kosong.');
                return;
            }

            if (kategori === '') {
                alert('Peringatan: Silakan pilih kategori transaksi.');
                return;
            }

            // Validasi lanjutan sesuai Enum Backend
            const validKategoriPemasukan = ['GAJI_PART_TIME', 'UANG_SAKU', 'FREELANCE', 'BONUS', 'LAINNYA'];
            const validKategoriPengeluaran = ['MAKANAN', 'TRANSPORTASI', 'BELAJAR', 'HIBURAN', 'TAGIHAN', 'LAINNYA'];

            // Uncomment validasi ketat ini jika Enum di file HTML sudah 100% sama dengan di Backend
            /*
            if (isPemasukan && !validKategoriPemasukan.includes(kategori)) {
                alert('Sistem Error: Kategori Pemasukan tidak valid.');
                return;
            }
            if (isPengeluaran && !validKategoriPengeluaran.includes(kategori)) {
                alert('Sistem Error: Kategori Pengeluaran tidak valid.');
                return;
            }
            */

            // 5. Susun Data (Diselaraskan dengan kebutuhan api.js)
            // api.js membutuhkan parameter: nominal, keterangan, kategori, tanggal
            const payloadTransaksi = {
                nominal: nominal,
                keterangan: deskripsi, // diselaraskan dengan api.js
                kategori: kategori,
                tanggal: new Date().toISOString().split('T')[0], // Mengambil tanggal hari ini format YYYY-MM-DD
                akun: akun // Tambahan, jaga-jaga jika Backend membutuhkannya
            };

            console.log('🚀 Payload siap dikirim ke API :', payloadTransaksi);

            // 6. Eksekusi pengiriman data ke Backend
            try {
                // Menampilkan status loading (opsional)
                const submitBtn = formTransaksi.querySelector('button[type="submit"]');
                if(submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerText = 'Menyimpan...';
                }

                // Tentukan endpoint berdasarkan halaman
                if (isPemasukan) {
                    await tambahPemasukan(payloadTransaksi);
                    alert('🎉 Berhasil! Pemasukan telah dicatat.');
                } else if (isPengeluaran) {
                    await tambahPengeluaran(payloadTransaksi);
                    alert('🎉 Berhasil! Pengeluaran telah dicatat.');
                } else {
                    alert('Sistem Error: Halaman tidak dikenali sebagai Pemasukan atau Pengeluaran.');
                    return;
                }

                // Kosongkan form kembali setelah sukses
                formTransaksi.reset();

                // Kembalikan tombol seperti semula
                if(submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Simpan Transaksi';
                }

            } catch (error) {
                console.error("Gagal menyimpan transaksi:", error);
                alert("❌ Gagal menyimpan transaksi: " + error.message);
                
                // Kembalikan tombol jika gagal
                const submitBtn = formTransaksi.querySelector('button[type="submit"]');
                if(submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Simpan Transaksi';
                }
            }
        });
    } else {
        console.warn('⚠️ Elemen form dengan ID "formTransaksi" belum ditemukan di HTML ini.');
    }
});