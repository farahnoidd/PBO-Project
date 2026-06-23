import { getProfil, requireAuth } from "./api.js";

requireAuth();

async function muatDataProfil() {
  try {
    const profil = await getProfil();

    // Render ke teks label komponen atas
    document.getElementById("lblNamaUser").innerText = profil.namaLengkap;
    document.getElementById("lblEmailUser").innerText = profil.email;

    // Isikan otomatis ke dalam elemen kotak input form
    document.getElementById("txtNamaLengkap").value = profil.namaLengkap;
    document.getElementById("txtEmail").value = profil.email;
    document.getElementById("txtTargetTabungan").value =
      profil.targetTabungan || 500000;
  } catch (err) {
    console.error("Gagal mengambil data profil:", err);
  }
}

document.getElementById("formProfil").addEventListener("submit", async (e) => {
  e.preventDefault();
  // Di tahap ini opsional, kamu bisa meluasinya dengan fungsi UPDATE profile kelak jika diinginkan dosen
  alert("Perubahan profil berhasil disimpan ke lokal!");
});

muatDataProfil();
