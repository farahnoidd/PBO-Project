package com.keuangan.app.service;

import com.keuangan.app.dto.RegisterRequest;
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

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, OtpService otpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REGISTRASI
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Mendaftarkan akun baru.
     * Status awal selalu BELUM_TERVALIDASI — user tidak bisa login
     * sebelum Admin mengubah statusnya menjadi TERVALIDASI.
     */
    public UserDto.UserResponse daftarAkun(RegisterRequest req) {

        if (isBlank(req.getUsername()) || isBlank(req.getEmail())
                || isBlank(req.getPassword()) || isBlank(req.getNamaLengkap())) {
            throw new IllegalArgumentException("Semua field wajib diisi.");
        }

        if (userRepository.existsByUsername(req.getUsername().trim())) {
            throw new IllegalArgumentException(
                    "Username '" + req.getUsername() + "' sudah digunakan.");
        }

        if (userRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException(
                    "Email '" + req.getEmail() + "' sudah terdaftar.");
        }

        if (req.getPassword().length() < 8) {
            throw new IllegalArgumentException("Password minimal 8 karakter.");
        }

        User user = new User();
        user.setUsername(req.getUsername().trim());
        user.setEmail(req.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setNamaLengkap(req.getNamaLengkap().trim());

        user.setRole(com.keuangan.app.enums.UserRole.USER);
        user.setStatus(com.keuangan.app.enums.UserStatus.BELUM_TERVALIDASI);

        user.setCreatedAt(java.time.LocalDateTime.now());

        User tersimpan = userRepository.save(user);

        try {
            otpService.generateAndSend(tersimpan.getUsername(), tersimpan.getEmail());
        } catch (Exception e) {
            // Log error tapi biarkan proses registrasi berhasil (200 OK)
            System.err.println("⚠️ SMTP ERROR: Gagal mengirim email OTP Registrasi. Reason: " + e.getMessage());
            // Catatan: Pastikan Anda menyediakan endpoint "Resend OTP" agar user bisa meminta ulang OTP
        }

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
        User user = userRepository.findByUsername(usernameOrEmail).orElse(null);
        if (user == null) {
            user = userRepository.findByEmail(usernameOrEmail)
                    .orElseThrow(
                            () -> new IllegalArgumentException("User tidak ditemukan dengan identifier tersebut."));
        }

        try {
            otpService.generateAndSend(user.getUsername(), user.getEmail());
        } catch (Exception e) {
            System.err.println("⚠️ SMTP ERROR: Gagal mengirim email OTP Lupa Password. Reason: " + e.getMessage());
        }
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

        if (statusBaru == UserStatus.BELUM_TERVALIDASI) {
            throw new IllegalArgumentException(
                    "Status tidak bisa diubah ke BELUM_TERVALIDASI.");
        }

        user.setStatus(statusBaru);

        if (statusBaru == UserStatus.TERVALIDASI) {
            user.setValidatedAt(LocalDateTime.now());
        } else {
            user.setValidatedAt(null);
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserDto.UserResponse> getUserMenungguValidasi() {
        return userRepository.findAllByStatus(UserStatus.BELUM_TERVALIDASI)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto.UserResponse> semuaUser() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

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

    private final java.util.Map<String, UserDto.UpdateProfileRequest> pendingProfilStore = new java.util.concurrent.ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public UserDto.UserResponse getProfilByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User '" + username + "' tidak ditemukan."));
        return toResponse(user);
    }

    public String prosesRequestProfil(String username, UserDto.UpdateProfileRequest dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User tidak ditemukan."));

        if (isBlank(dto.getNamaLengkap()))
            throw new IllegalArgumentException("Nama lengkap wajib diisi.");
        if (isBlank(dto.getEmail()))
            throw new IllegalArgumentException("Email wajib diisi.");

        String emailBaru = dto.getEmail().trim().toLowerCase();

        if (!emailBaru.equals(user.getEmail())) {
            if (userRepository.existsByEmail(emailBaru)) {
                throw new IllegalArgumentException("Email sudah terdaftar oleh pengguna lain.");
            }

            pendingProfilStore.put(username, dto);

            try {
                otpService.generateAndSend(username, emailBaru);
            } catch (Exception e) {
                System.err.println("⚠️ SMTP ERROR: Gagal mengirim email OTP Update Profil. Reason: " + e.getMessage());
            }
            return "OTP_REQUIRED: Kode verifikasi telah dikirim ke email baru Anda.";
        }

        user.setNamaLengkap(dto.getNamaLengkap().trim());
        userRepository.save(user);
        return "Profil Anda berhasil diperbarui.";
    }

    public UserDto.UserResponse verifikasiDanSaveProfil(com.keuangan.app.dto.VerifyOtpRequest req) {
        if (!otpService.verify(req.getUsername(), req.getOtp())) {
            throw new IllegalArgumentException("Kode OTP tidak valid atau sudah kedaluwarsa.");
        }

        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User tidak ditemukan."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Password yang Anda masukkan salah.");
        }

        UserDto.UpdateProfileRequest dataPending = pendingProfilStore.get(req.getUsername());
        if (dataPending == null) {
            throw new IllegalArgumentException("Sesi pembaruan kadaluwarsa, silakan submit ulang form.");
        }

        user.setNamaLengkap(dataPending.getNamaLengkap().trim());
        user.setEmail(dataPending.getEmail().trim().toLowerCase());

        User userTersimpan = userRepository.save(user);
        pendingProfilStore.remove(req.getUsername());

        return toResponse(userTersimpan);
    }

    public void updateFoto(String username, String fotoBase64) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User '" + username + "' tidak ditemukan."));
        user.setFoto(fotoBase64);
        userRepository.save(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPER
    // ─────────────────────────────────────────────────────────────────────────

    private UserDto.UserResponse toResponse(User user) {
        UserDto.UserResponse resp = new UserDto.UserResponse();
        resp.setId(user.getId());
        resp.setUsername(user.getUsername());
        resp.setEmail(user.getEmail());
        resp.setNamaLengkap(user.getNamaLengkap());
        resp.setRole(user.getRole().name());
        resp.setStatus(user.getStatus().name());
        resp.setCreatedAt(user.getCreatedAt() != null
                ? user.getCreatedAt().format(FORMATTER)
                : null);
        resp.setValidatedAt(user.getValidatedAt() != null
                ? user.getValidatedAt().format(FORMATTER)
                : null);
        resp.setFoto(user.getFoto());
        return resp;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}