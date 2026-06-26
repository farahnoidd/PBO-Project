package com.keuangan.app.controller;

import com.keuangan.app.dto.UserDto;
import com.keuangan.app.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UserController — Manajemen Akun & Admin
 *
 * Kontrak API:
 * ┌─────────────────────────────────────────────────────┬────────────┐
 * │ Endpoint                                            │ Akses      │
 * ├─────────────────────────────────────────────────────┼────────────┤
 * │ POST   /api/auth/register                           │ Public     │
 * │ GET    /api/user/profil                             │ USER/ADMIN │
 * │ GET    /api/admin/users                             │ ADMIN only │
 * │ GET    /api/admin/users/menunggu                    │ ADMIN only │
 * │ GET    /api/admin/users/{id}                        │ ADMIN only │
 * │ PUT    /api/admin/users/{id}/validasi               │ ADMIN only │
 * └─────────────────────────────────────────────────────┴────────────┘
 */
@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC – REGISTRASI
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/auth/register
     *
     * Mendaftarkan akun baru. Status awal otomatis BELUM_TERVALIDASI.
     * User tidak dapat login sebelum Admin memvalidasi akun.
     *
     * Request body:
     * {
     *   "username":   "budi123",
     *   "email":      "budi@example.com",
     *   "password":   "rahasia123",
     *   "namaLengkap": "Budi Santoso"
     * }
     */
    @PostMapping("/api/auth/register")
    public ResponseEntity<UserDto.ApiResponse> register(
            @RequestBody UserDto.RegisterRequest request) {

        try {
            UserDto.UserResponse data = userService.daftarAkun(request);
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(new UserDto.ApiResponse(true,
                            "Pendaftaran berhasil. Akun Anda sedang menunggu validasi Admin.",
                            data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new UserDto.ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/api/auth/register/verify-otp")
    public ResponseEntity<UserDto.ApiResponse> verifyRegisterOtp(
            @RequestBody com.keuangan.app.dto.VerifyOtpRequest request) {
        try {
            UserDto.UserResponse data = userService.verifyRegisterOtp(request);
            return ResponseEntity.ok(new UserDto.ApiResponse(true, "Registrasi berhasil, akun divalidasi.", data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new UserDto.ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/api/auth/forgot-password/send-otp")
    public ResponseEntity<UserDto.ApiResponse> forgotPasswordSendOtp(
            @RequestBody UserDto.ForgotPasswordRequest request) {
        try {
            userService.forgotPasswordSendOtp(request.getUsername());
            return ResponseEntity.ok(new UserDto.ApiResponse(true, "OTP telah dikirim ke email Anda."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new UserDto.ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/api/auth/forgot-password/reset")
    public ResponseEntity<UserDto.ApiResponse> resetPassword(
            @RequestBody UserDto.ResetPasswordRequest request) {
        try {
            userService.resetPassword(request);
            return ResponseEntity.ok(new UserDto.ApiResponse(true, "Password berhasil direset. Silakan login."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new UserDto.ApiResponse(false, e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USER – PROFIL SENDIRI
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/user/profil
     *
     * Mengembalikan data profil user yang sedang login.
     * Username diambil dari JWT token (via Authentication principal).
     */
    @GetMapping("/api/user/profil")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<UserDto.ApiResponse> getProfil(Authentication auth) {

        try {
            UserDto.UserResponse data = userService.getProfilByUsername(auth.getName());
            return ResponseEntity.ok(
                    new UserDto.ApiResponse(true, "Profil berhasil diambil.", data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new UserDto.ApiResponse(false, e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE PROFIL & VERIFIKASI OTP – GAYA 2FA MULTI-STEP
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * PUT /api/user/profil
     * Langkah 1: Request update profil. Jika email berubah, kirim OTP & tahan data di memori.
     */
    @PutMapping("/api/user/profil")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<UserDto.ApiResponse> requestUpdateProfil(
            Authentication auth,
            @RequestBody UserDto.UpdateProfileRequest request) {
        try {
            String pesan = userService.prosesRequestProfil(auth.getName(), request);
            return ResponseEntity.ok(new UserDto.ApiResponse(true, pesan));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new UserDto.ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * POST /api/user/profil/verify-otp
     * Langkah 2: Verifikasi OTP + Password via DTO asli kelompokmu untuk save ke MySQL.
     */
    @PostMapping("/api/user/profil/verify-otp")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<UserDto.ApiResponse> finalisgGantiEmail(
            @RequestBody com.keuangan.app.dto.VerifyOtpRequest request) {
        try {
            UserDto.UserResponse data = userService.verifikasiDanSaveProfil(request);
            return ResponseEntity.ok(new UserDto.ApiResponse(true, "Profil dan email baru Anda sukses diperbarui!", data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new UserDto.ApiResponse(false, e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN – MANAJEMEN USER
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/users
     *
     * Mengembalikan daftar seluruh user yang terdaftar.
     */
    @GetMapping("/api/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse> semuaUser() {
        List<UserDto.UserResponse> data = userService.semuaUser();
        return ResponseEntity.ok(
                new UserDto.ApiResponse(true,
                        "Berhasil mengambil " + data.size() + " user.", data));
    }

    /**
     * GET /api/admin/users/menunggu
     *
     * Mengembalikan daftar user dengan status BELUM_TERVALIDASI.
     * Admin menggunakan endpoint ini untuk meninjau pendaftar baru.
     */
    @GetMapping("/api/admin/users/menunggu")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse> userMenungguValidasi() {
        List<UserDto.UserResponse> data = userService.getUserMenungguValidasi();
        return ResponseEntity.ok(
                new UserDto.ApiResponse(true,
                        data.size() + " user menunggu validasi.", data));
    }

    /**
     * GET /api/admin/users/{id}
     *
     * Mengembalikan detail satu user berdasarkan ID.
     */
    @GetMapping("/api/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse> getUserById(@PathVariable Long id) {

        try {
            UserDto.UserResponse data = userService.getUserById(id);
            return ResponseEntity.ok(
                    new UserDto.ApiResponse(true, "Data user ditemukan.", data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new UserDto.ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * PUT /api/admin/users/{id}/validasi
     *
     * Admin memvalidasi atau menolak akun user.
     *
     * Request body:
     * {
     *   "status": "TERVALIDASI"   ← atau "DITOLAK"
     * }
     *
     * Response sukses:
     * {
     *   "success": true,
     *   "message": "Status user berhasil diperbarui.",
     *   "data": { ...UserResponse... }
     * }
     */
    @PutMapping("/api/admin/users/{id}/validasi")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse> validasiUser(
            @PathVariable Long id,
            @RequestBody UserDto.ValidasiRequest request) {

        try {
            UserDto.UserResponse data = userService.validasiUser(id, request);
            return ResponseEntity.ok(
                    new UserDto.ApiResponse(true,
                            "Status user berhasil diperbarui.", data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new UserDto.ApiResponse(false, e.getMessage()));
        }
    }
}
