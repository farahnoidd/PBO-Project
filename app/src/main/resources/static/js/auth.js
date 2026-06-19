/**
 * File: auth.js
 * Fungsi: Menangani proses Login, Logout, dan Profil.
 */

import { login, logout } from './api.js';

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    // --- FITUR LOGIN ---
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");

            const username = emailInput ? emailInput.value : "";
            const password = passwordInput ? passwordInput.value : "";

            try {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = 'Memproses...';
                }

                // Cukup panggil fungsinya. api.js secara otomatis akan menyimpan tokennya!
                const response = await login(username, password);

                alert("Login Berhasil!");
                
                // Arahkan berdasarkan role
                if (response && response.role === "ADMIN") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "dashboard.html";
                }

            } catch (error) {
                alert("Login Gagal: " + error.message);
                
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Masuk ke Dashboard <span class="material-symbols-outlined text-[18px]">arrow_forward</span>';
                }
            }
        });
    }

    // --- FITUR LOGOUT UNIVERSAL ---
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => {
        if (btn.innerText.toLowerCase().includes('logout')) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const confirmLogout = confirm("Apakah Anda yakin ingin keluar?");
                if (confirmLogout) {
                    logout(); 
                }
            });
        }
    });
});