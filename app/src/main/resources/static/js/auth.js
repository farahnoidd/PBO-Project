document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const btnLogout = document.getElementById("btnLogout");
    const profileForm = document.getElementById("profileForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            localStorage.setItem("isLoggedIn", "true");
            alert("Login Berhasil! (Simulasi)");
            window.location.href = "admin.html";
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("isLoggedIn");
            alert("Anda telah logout.");
            window.location.href = "index.html";
        });
    }

    if (profileForm) {
        profileForm.addEventListener("submit", function (e) {
            e.preventDefault();
            alert("Perubahan profil berhasil disimpan! (Simulasi)");
        });
    }
});
