# PBO-Project
Tugas Kelompok PBO


m1 jadit
m2 farah a
m3 gias
m4 farid
m5 ali
m6 faza
m7 ferdinan
m8 farah d
m9 farhan
m10 fikri
m11 firda
m12 fathan
m13 fadhillah

Kelompok 1: Manajemen & Infrastruktur (2 Orang)
Orang 1: Project Manager / System Analyst (Leader)
Tugas: Menyusun kontrak API (misal format JSON yang dikirim antara frontend dan backend), merancang skema database (ERD), koordinasi tim, dan memastikan jadwal rilis sesuai target.

Orang 2: DevOps & Database Administrator (DBA)
Tugas: Konfigurasi application.properties (koneksi DB), membuat database di server lokal/cloud, setup Git/GitHub untuk kolaborasi tim, dan membantu proses deployment aplikasi.

Kelompok 2: Backend Developer - Spring Boot (5 Orang)
Orang 3: BE Developer - Autentikasi & Keamanan
Tugas: Membuat sistem Login dan Register. Bertanggung jawab penuh atas folder security/ (JWT), AuthController.java, AuthService.java, dan UserRepository.java.

Orang 4: BE Developer - Manajemen User & Admin
Tugas: Membuat fitur profil dan validasi admin. Menangani UserController.java, UserService.java, logika status is_validated (hanya bisa diubah oleh admin), dan update data di User.java.

Orang 5: BE Developer - Modul Pemasukan (Income)
Tugas: Membuat logika simpan dan ambil data pemasukan. Menangani enums/IncomeCategory.java, sebagian TransactionController.java, TransactionService.java, dan TransactionRepository.java khusus data masuk.

Orang 6: BE Developer - Modul Pengeluaran (Expense)
Tugas: Membuat logika simpan dan ambil data pengeluaran. Menangani enums/ExpenseCategory.java, kalkulasi sisa budget, dan integrasi pengeluaran ke TransactionService.java.

Orang 7: BE Developer - Laporan & Ringkasan Statistik
Tugas: Membuat fungsi agregasi data untuk laporan bulanan/tahunan (seperti grafik pemasukan vs pengeluaran, perhitungan total saldo keseluruhan). Bertanggung jawab penuh pada folder dto/ untuk format data grafik dashboard.

Kelompok 3: Frontend Developer - HTML, CSS, JS (4 Orang)
Orang 8: FE Developer - UI Base, Styling, & Auth
Tugas: Membuat file css/style.css, css/components.css (supaya UI seragam antar halaman), halaman index.html (Login), profil.html, serta js/auth.js.

Orang 9: FE Developer - Dashboard & Chart Integration
Tugas: Membuat halaman dashboard.html dan js/dashboard.js. Mengintegrasikan library chart (seperti Chart.js) untuk menampilkan grafik donat kategori pengeluaran dan grafik batang sesuai di UI.

Orang 10: FE Developer - Halaman Transaksi (Pemasukan & Pengeluaran)
Tugas: Membuat pemasukan.html, pengeluaran.html, dan js/transaksi.js. Mengurus form input nominal, deskripsi, dropdown kategori (Sesuai ketentuan enum), dan dropdown akun keuangan (BCA, Mandiri, dll).

Orang 11: FE Developer - Halaman Laporan Bulanan & Admin
Tugas: Membuat laporan.html, admin.html (tabel daftar user baru untuk divalidasi admin), js/admin.js, serta fitur cetak/download laporan PDF jika tombol ditekan.

Kelompok 4: Quality Assurance / Tester (2 Orang)
Orang 12: QA Backend Tester
Tugas: Membuat Unit Testing di folder src/test/java, menguji semua endpoint API menggunakan aplikasi seperti Postman (menguji skenario login salah, input kategori ilegal, atau akses admin tanpa izin).

Orang 13: QA Frontend & E2E Tester
Tugas: Melakukan pengujian fungsionalitas visual web (apakah chart muncul dengan benar, tombol responsif, form validasi bekerja, dan memastikan alur aplikasi dari login hingga input transaksi berjalan mulus tanpa error di browser).
