package com.keuangan.app.service;

import com.keuangan.app.dto.UserDto;
import com.keuangan.app.dto.VerifyOtpRequest;
import com.keuangan.app.enums.UserStatus;
import com.keuangan.app.model.User;
import com.keuangan.app.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, OtpService otpService) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService      = otpService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REGISTRASI
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Mendaftarkan akun baru.
     * Status awal selalu BELUM_TERVALIDASI — user tidak bisa login
     * sebelum Admin mengubah statusnya menjadi TERVALIDASI.
     */
    public UserDto.UserResponse daftarAkun(UserDto.RegisterRequest req) {

        // Validasi input tidak boleh kosong
        if (isBlank(req.getUsername()) || isBlank(req.getEmail())
                || isBlank(req.getPassword()) || isBlank(req.getNamaLengkap())) {
            throw new IllegalArgumentException("Semua field wajib diisi.");
        }

        // Cek duplikat username
        if (userRepository.existsByUsername(req.getUsername().trim())) {
            throw new IllegalArgumentException(
                    "Username '" + req.getUsername() + "' sudah digunakan.");
        }

        // Cek duplikat email
        if (userRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException(
                    "Email '" + req.getEmail() + "' sudah terdaftar.");
        }

        // Validasi panjang password minimal 8 karakter
        if (req.getPassword().length() < 8) {
            throw new IllegalArgumentException("Password minimal 8 karakter.");
        }

        // Buat entitas user baru — status otomatis BELUM_TERVALIDASI
        User user = new User(
                req.getUsername().trim(),
                req.getEmail().trim().toLowerCase(),
                passwordEncoder.encode(req.getPassword()),
                req.getNamaLengkap().trim()
        );

        User tersimpan = userRepository.save(user);

        // Kirim OTP
        otpService.generateAndSend(tersimpan.getUsername(), tersimpan.getEmail());

        return toResponse(tersimpan);
    }

    public UserDto.UserResponse verifyRegisterOtp(VerifyOtpRequest req) {
        if (!otpService.verify(req.getUsername(), req.getOtp())) {
            throw new IllegalArgumentException("OTP tidak valid atau sudah expired.");
        }
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User tidak ditemukan."));

        if (user.getStatus() != UserStatus.BELUM_TERVALIDASI) {
            throw new IllegalArgumentException("Akun ini sudah divalidasi atau ditolak.");
        }

        user.setStatus(UserStatus.TERVALIDASI);
        user.setValidatedAt(LocalDateTime.now());
        return toResponse(userRepository.save(user));
    }

    public void forgotPasswordSendOtp(String usernameOrEmail) {
        // Cari user berdasarkan username atau email
        User user = userRepository.findByUsername(usernameOrEmail).orElse(null);
        if (user == null) {
            user = userRepository.findByEmail(usernameOrEmail)
                    .orElseThrow(() -> new IllegalArgumentException("User tidak ditemukan dengan identifier tersebut."));
        }
        
        otpService.generateAndSend(user.getUsername(), user.getEmail());
    }

    public void resetPassword(UserDto.ResetPasswordRequest req) {
        if (!otpService.verify(req.getUsername(), req.getOtp())) {
            throw new IllegalArgumentException("OTP tidak valid atau sudah expired.");
        }

        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User tidak ditemukan."));

        if (req.getNewPassword() == null || req.getNewPassword().length() < 8) {
            throw new IllegalArgumentException("Password minimal 8 karakter.");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN – MANAJEMEN USER
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Admin: ubah status user (TERVALIDASI atau DITOLAK).
     * Hanya endpoint ini yang boleh mengubah status; user biasa tidak bisa.
     */
    public UserDto.UserResponse validasiUser(Long userId, UserDto.ValidasiRequest req) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User dengan ID " + userId + " tidak ditemukan."));

        UserStatus statusBaru;
        try {
            statusBaru = UserStatus.valueOf(req.getStatus().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException(
                    "Status tidak valid. Gunakan: TERVALIDASI atau DITOLAK.");
        }

        // Tidak boleh mengubah kembali ke BELUM_TERVALIDASI lewat endpoint ini
        if (statusBaru == UserStatus.BELUM_TERVALIDASI) {
            throw new IllegalArgumentException(
                    "Status tidak bisa diubah ke BELUM_TERVALIDASI.");
        }

        user.setStatus(statusBaru);

        // Catat waktu validasi jika disetujui
        if (statusBaru == UserStatus.TERVALIDASI) {
            user.setValidatedAt(LocalDateTime.now());
        } else {
            user.setValidatedAt(null);
        }

        return toResponse(userRepository.save(user));
    }

    /**
     * Admin: ambil semua user yang menunggu validasi.
     */
    @Transactional(readOnly = true)
    public List<UserDto.UserResponse> getUserMenungguValidasi() {
        return userRepository.findAllByStatus(UserStatus.BELUM_TERVALIDASI)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Admin: ambil semua user terdaftar.
     */
    @Transactional(readOnly = true)
    public List<UserDto.UserResponse> semuaUser() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Admin: ambil detail satu user berdasarkan ID.
     */
    @Transactional(readOnly = true)
    public UserDto.UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User dengan ID " + userId + " tidak ditemukan."));
        return toResponse(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROFIL USER & IN-MEMORY OTP TRACKER
    // ─────────────────────────────────────────────────────────────────────────

    // Struktur data penampung memori sementara (Mirip arsitektur OtpService kalian)
    private final java.util.Map<String, UserDto.UpdateProfileRequest> pendingProfilStore = new java.util.concurrent.ConcurrentHashMap<>();

    /**
     * Ambil profil user berdasarkan username (dari JWT Principal).
     */
    @Transactional(readOnly = true)
    public UserDto.UserResponse getProfilByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User '" + username + "' tidak ditemukan."));
        return toResponse(user);
    }

    /**
     * Memproses request awal profil. Jika ganti email, trigger OtpService kelompokmu.
     */
    public String prosesRequestProfil(String username, UserDto.UpdateProfileRequest dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User tidak ditemukan."));

        if (isBlank(dto.getNamaLengkap())) throw new IllegalArgumentException("Nama lengkap wajib diisi.");
        if (isBlank(dto.getEmail())) throw new IllegalArgumentException("Email wajib diisi.");

        String emailBaru = dto.getEmail().trim().toLowerCase();

        // Skenario A: Jika email berubah, lakukan validasi ganda & kirim OTP
        if (!emailBaru.equals(user.getEmail())) {
            if (userRepository.existsByEmail(emailBaru)) {
                throw new IllegalArgumentException("Email sudah terdaftar oleh pengguna lain.");
            }
            
            // Tahan perubahan di memori sementara agar tidak langsung bocor/terganti ke MySQL
            pendingProfilStore.put(username, dto);
            
            // Panggil OtpService asli milik kelompokmu!
            otpService.generateAndSend(username, emailBaru);
            return "OTP_REQUIRED: Kode verifikasi telah dikirim ke email baru Anda.";
        }

        // Skenario B: Email sama (cuma ganti nama), langsung bypass write ke MySQL tanpa OTP
        user.setNamaLengkap(dto.getNamaLengkap().trim());
        userRepository.save(user);
        return "Profil Anda berhasil diperbarui.";
    }

    /**
     * Validasi OTP + Password menggunakan DTO asli milik kelompokmu, lalu tulis ke MySQL.
     */
    public UserDto.UserResponse verifikasiDanSaveProfil(com.keuangan.app.dto.VerifyOtpRequest req) {
        // 1. Validasi kecocokan OTP via OtpService kalian
        if (!otpService.verify(req.getUsername(), req.getOtp())) {
            throw new IllegalArgumentException("Kode OTP tidak valid atau sudah kedaluwarsa.");
        }

        // 2. Ambil entity user asli dari MySQL
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User tidak ditemukan."));

        // 3. Validasi Password saat ini demi keamanan 2FA akun
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Password yang Anda masukkan salah.");
        }

        // 4. Ambil data perubahan yang ditahan di memori sementara tadi
        UserDto.UpdateProfileRequest dataPending = pendingProfilStore.get(req.getUsername());
        if (dataPending == null) {
            throw new IllegalArgumentException("Sesi pembaruan kadaluwarsa, silakan submit ulang form.");
        }

        // 5. Tulis permanen data baru ke MySQL
        user.setNamaLengkap(dataPending.getNamaLengkap().trim());
        user.setEmail(dataPending.getEmail().trim().toLowerCase());
        
        User userTersimpan = userRepository.save(user);
        pendingProfilStore.remove(req.getUsername()); // Bersihkan ram memori

        return toResponse(userTersimpan);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPER
    // ─────────────────────────────────────────────────────────────────────────

    /** Konversi entitas User → DTO respons (tanpa mengekspos password). */
    private UserDto.UserResponse toResponse(User user) {
        UserDto.UserResponse resp = new UserDto.UserResponse();
        resp.setId(user.getId());
        resp.setUsername(user.getUsername());
        resp.setEmail(user.getEmail());
        resp.setNamaLengkap(user.getNamaLengkap());
        resp.setRole(user.getRole().name());
        resp.setStatus(user.getStatus().name());
        resp.setCreatedAt(user.getCreatedAt() != null
                ? user.getCreatedAt().format(FORMATTER) : null);
        resp.setValidatedAt(user.getValidatedAt() != null
                ? user.getValidatedAt().format(FORMATTER) : null);
        return resp;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
