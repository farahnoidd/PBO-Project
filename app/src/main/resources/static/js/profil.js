import {
  getProfil,
  updateProfil,
  verifyProfileOtp,
  requireAuth,
  logout,
} from "./api.js";

requireAuth();

let userPrefix = "guest";
let emailLamaDariDB = "";
let usernameAktifDariDB = ""; // 💡 Menampung username resmi pemilik token

async function muatDataProfil() {
  try {
    const profil = await getProfil();
    if (profil && profil.data) {
      const user = profil.data;
      usernameAktifDariDB = (user.username || "").trim();
      emailLamaDariDB = (user.email || "").trim().toLowerCase();
      userPrefix = user.email
        ? user.email.replace(/[^a-zA-Z0-9]/g, "_")
        : "guest";

      if (document.getElementById("txtNamaLengkap"))
        document.getElementById("txtNamaLengkap").value =
          user.namaLengkap || "";
      if (document.getElementById("txtEmail"))
        document.getElementById("txtEmail").value = user.email || "";
      if (document.getElementById("lblNamaUser"))
        document.getElementById("lblNamaUser").innerText =
          user.namaLengkap || "User";
      if (document.getElementById("lblEmailUser"))
        document.getElementById("lblEmailUser").innerText = user.email || "";
    }

    const targetLokal =
      localStorage.getItem(`${userPrefix}_target_tabungan`) || "500000";
    const budgetLokal =
      localStorage.getItem(`${userPrefix}_limit_anggaran`) || "1000000";

    if (document.getElementById("txtTargetTabungan"))
      document.getElementById("txtTargetTabungan").value = targetLokal;
    if (document.getElementById("txtBatasBudget"))
      document.getElementById("txtBatasBudget").value = budgetLokal;
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  muatDataProfil();

  const formProfil = document.getElementById("formProfil");
  const modalOtp = document.getElementById("modalOtpEmail");
  const formOtp = document.getElementById("formVerifikasiOtpEmail");
  const btnBatal = document.getElementById("btnBatalOtp");

  let tempNama = "",
    tempEmail = "",
    tempTarget = "",
    tempBudget = "";

  if (formProfil) {
    formProfil.addEventListener("submit", async (e) => {
      e.preventDefault();
      tempNama = document.getElementById("txtNamaLengkap").value.trim();
      tempEmail = document
        .getElementById("txtEmail")
        .value.trim()
        .toLowerCase();
      tempTarget = document.getElementById("txtTargetTabungan").value;
      tempBudget = document.getElementById("txtBatasBudget").value;

      if (tempEmail !== emailLamaDariDB) {
        try {
          const res = await updateProfil({
            namaLengkap: tempNama,
            email: tempEmail,
          });
          // Jika backend merespon butuh OTP, panggil modal popup
          if (res && res.message && res.message.includes("OTP_REQUIRED")) {
            if (modalOtp) modalOtp.classList.remove("hidden");
          }
        } catch (err) {
          alert("❌ Gagal merestart email: " + err.message);
        }
      } else {
        try {
          await updateProfil({ namaLengkap: tempNama, email: tempEmail });

          // 💡 SINKRONISASI: Simpan ke key spesifik user & backup ke key global interaktif
          localStorage.setItem(`${userPrefix}_target_tabungan`, tempTarget);
          localStorage.setItem(`${userPrefix}_limit_anggaran`, tempBudget);
          localStorage.setItem("fb_current_target_tabungan", tempTarget);
          localStorage.setItem("fb_current_limit_anggaran", tempBudget);

          alert("🎉 Sukses! Perubahan profil berhasil disimpan di MySQL.");
          await muatDataProfil();
        } catch (err) {
          alert("❌ Eror: " + err.message);
        }
      }
    });
  }

  if (formOtp) {
    formOtp.addEventListener("submit", async (e) => {
      e.preventDefault();
      const passVerify = document.getElementById("txtPasswordVerify").value;
      const kodeOtpInput = document.getElementById("txtOtpProfil").value.trim();
      const btnKonfirm = document.getElementById("btnKonfirmasiOtp");

      try {
        btnKonfirm.disabled = true;
        btnKonfirm.innerText = "Memvalidasi...";

        // 💡 INTEGRASI AKURAT: Kirim data 2FA lengkap sesuai keinginan VerifyOtpRequest kelompokmu
        await verifyProfileOtp(usernameAktifDariDB, passVerify, kodeOtpInput);

        // Migrasikan set data budget lokal ke prefix domain email baru & update key global
        userPrefix = tempEmail.replace(/[^a-zA-Z0-9]/g, "_");
        localStorage.setItem(`${userPrefix}_target_tabungan`, tempTarget);
        localStorage.setItem(`${userPrefix}_limit_anggaran`, tempBudget);
        localStorage.setItem("fb_current_target_tabungan", tempTarget);
        localStorage.setItem("fb_current_limit_anggaran", tempBudget);

        alert(
          "🎉 Luar biasa, Email baru terverifikasi sukses & database MySQL terupdate!",
        );
        if (modalOtp) modalOtp.classList.add("hidden");
        formOtp.reset();
        await muatDataProfil();
      } catch (err) {
        alert("❌ Validasi Gagal: " + err.message);
      } finally {
        btnKonfirm.disabled = false;
        btnKonfirm.innerText = "Verifikasi & Simpan";
      }
    });
  }

  if (btnBatal && modalOtp) {
    btnBatal.onclick = () => {
      modalOtp.classList.add("hidden");
      formOtp.reset();
    };
  }

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Apakah Anda yakin ingin keluar dari FinanceBuddy?"))
        localStorage.removeItem("fb_current_limit_anggaran");
      localStorage.removeItem("fb_current_target_tabungan");
      logout();
    });
  }
});
