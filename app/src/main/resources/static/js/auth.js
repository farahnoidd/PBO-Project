/**
 * File: auth.js
 * Fungsi: Menangani proses Login, Logout, dan Profil.
 */

// 1. IMPORT fungsi dari api.js
import { login, logout } from './api.js';

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const profileForm = document.getElementById("profileForm");

    // --- FITUR LOGIN ---
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            // Ambil nilai dari input (ID disesuaikan dengan form di index.html)
            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");

            // Di api.js parameternya bernama (username, password), 
            // kita kirimkan email pengguna sebagai username.
            const username = emailInput ? emailInput.value : "";
            const password = passwordInput ? passwordInput.value : "";

            try {
                // Tampilkan status loading agar tombol tidak bisa di-klik berkali-kali
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalText = submitBtn ? submitBtn.innerHTML : "Masuk";
                
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = 'Memproses...';
                }

                // Panggil fungsi login dari api.js ke Spring Boot
                const response = await login(username, password);

                alert("Login Berhasil!");
                
                // Arahkan berdasarkan role yang dikembalikan Backend
                if (response.role === "ADMIN") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "dashboard.html";
                }

            } catch (error) {
                // Jika password salah atau user tidak ditemukan
                alert("Login Gagal: " + error.message);
                
                // Kembalikan tombol ke semula
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Masuk ke Dashboard <span class="material-symbols-outlined text-[18px]">arrow_forward</span>';
                }
            }
        });
    }

    // --- FITUR LOGOUT UNIVERSAL ---
    // Mencari semua tombol di halaman yang memiliki kata "logout" (termasuk di sidebar)
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => {
        if (btn.innerText.toLowerCase().includes('logout')) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const confirmLogout = confirm("Apakah Anda yakin ingin keluar?");
                if (confirmLogout) {
                    logout(); // Memanggil fungsi logout dari api.js yang akan menghapus token
                }
            });
        }
    });

    // --- FITUR UPDATE PROFIL ---
    if (profileForm) {
        profileForm.addEventListener("submit", function (e) {
            e.preventDefault();
            // Catatan: Ini masih simulasi sampai ada endpoint update profil di api.js
            alert("Perubahan profil berhasil disimpan! (Menunggu integrasi API Backend)");
        });
    }
});