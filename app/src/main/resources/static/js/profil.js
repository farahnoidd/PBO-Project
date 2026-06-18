/**
 * File: profil.js
 * Tim Frontend (Mahasiswa 10 & 12)
 * Fungsi: Mengelola UI Profil, memuat data akun dari API Backend, dan menangani pembaruan profil.
 */

import { getProfil, requireAuth } from './api.js';

// PROTEKSI HALAMAN
requireAuth();

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    setupProfileForm();
});

/**
 * Mengambil data profil dari API dan menampilkannya ke UI
 */
async function loadUserProfile() {
    try {
        const profil = await getProfil();

        // Target elemen berdasarkan ID yang baru ditambahkan di HTML
        const inputNama = document.getElementById('inputNamaLengkap');
        const inputEmail = document.getElementById('inputEmail');
        const textHeaderNama = document.getElementById('displayNamaLengkap');
        const textHeaderEmail = document.getElementById('displayEmail');

        // Isi nilai form & teks dari data response Backend
        if (profil) {
            if (inputNama && profil.namaLengkap) inputNama.value = profil.namaLengkap;
            if (inputEmail && profil.email) inputEmail.value = profil.email;
            
            if (textHeaderNama && profil.namaLengkap) textHeaderNama.innerText = profil.namaLengkap;
            if (textHeaderEmail && profil.email) textHeaderEmail.innerText = profil.email;
        }

    } catch (error) {
        console.error("🔴 Gagal memuat profil pengguna:", error);
    }
}

/**
 * Mengelola event submit form profil
 */
function setupProfileForm() {
    const profileForm = document.getElementById('profileForm');

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Ambil data dari input ID
            const inputNama = document.getElementById('inputNamaLengkap');
            const inputTargetTabungan = document.getElementById('inputTargetTabungan');
            
            const namaLengkap = inputNama ? inputNama.value.trim() : '';
            const targetTabungan = inputTargetTabungan ? inputTargetTabungan.value.replace(/[^0-9]/g, '') : '0';

            if (namaLengkap === '') {
                alert('Peringatan: Nama lengkap tidak boleh dikosongkan.');
                return;
            }

            try {
                const submitBtn = profileForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerText = 'Menyimpan...';
                }

                // CATATAN UNTUK TIM BACKEND (Mahasiswa 8 & 12):
                // Jika API update profil sudah siap, aktifkan baris di bawah ini.
                /*
                await updateProfil({
                    namaLengkap: namaLengkap,
                    targetTabungan: parseInt(targetTabungan)
                });
                */

                // Simulasi sukses
                setTimeout(() => {
                    alert("🎉 Sukses! Perubahan profil berhasil disimpan.");

                    // Perbarui nama di header
                    const textHeaderNama = document.getElementById('displayNamaLengkap');
                    if (textHeaderNama) textHeaderNama.innerText = namaLengkap;

                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerText = 'Simpan Perubahan';
                    }
                }, 800);

            } catch (error) {
                console.error("Gagal memperbarui data profil:", error);
                alert("❌ Gagal menyimpan perubahan: " + error.message);
            }
        });
    }
}