package com.keuangan.app.dto;

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST DTOs
// ─────────────────────────────────────────────────────────────────────────────

public class UserDto {

    // ── Registrasi akun baru ──────────────────────────────────────────────────
    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;
        private String namaLengkap;

        public RegisterRequest() {}

        public String getUsername()         { return username; }
        public void setUsername(String u)   { this.username = u; }

        public String getEmail()            { return email; }
        public void setEmail(String e)      { this.email = e; }

        public String getPassword()         { return password; }
        public void setPassword(String p)   { this.password = p; }

        public String getNamaLengkap()      { return namaLengkap; }
        public void setNamaLengkap(String n){ this.namaLengkap = n; }
    }

    // ── Validasi user oleh Admin ──────────────────────────────────────────────
    public static class ValidasiRequest {
        // TERVALIDASI atau DITOLAK
        private String status;

        public ValidasiRequest() {}

        public String getStatus()           { return status; }
        public void setStatus(String s)     { this.status = s; }
    }

    // ── Lupa Password ─────────────────────────────────────────────────────────
    public static class ForgotPasswordRequest {
        private String username;

        public ForgotPasswordRequest() {}
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
    }

    public static class ResetPasswordRequest {
        private String username;
        private String otp;
        private String newPassword;

        public ResetPasswordRequest() {}
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE DTOs
    // ─────────────────────────────────────────────────────────────────────────

    // ── Info ringkas user (dikembalikan ke client) ────────────────────────────
    public static class UserResponse {
        private Long   id;
        private String username;
        private String email;
        private String namaLengkap;
        private String role;
        private String status;
        private String createdAt;
        private String validatedAt;

        public UserResponse() {}

        public Long   getId()                       { return id; }
        public void   setId(Long id)                { this.id = id; }

        public String getUsername()                 { return username; }
        public void   setUsername(String u)         { this.username = u; }

        public String getEmail()                    { return email; }
        public void   setEmail(String e)            { this.email = e; }

        public String getNamaLengkap()              { return namaLengkap; }
        public void   setNamaLengkap(String n)      { this.namaLengkap = n; }

        public String getRole()                     { return role; }
        public void   setRole(String r)             { this.role = r; }

        public String getStatus()                   { return status; }
        public void   setStatus(String s)           { this.status = s; }

        public String getCreatedAt()                { return createdAt; }
        public void   setCreatedAt(String d)        { this.createdAt = d; }

        public String getValidatedAt()              { return validatedAt; }
        public void   setValidatedAt(String d)      { this.validatedAt = d; }
    }

    // ── Respons generik untuk pesan sukses/gagal ──────────────────────────────
    public static class ApiResponse {
        private boolean success;
        private String  message;
        private Object  data;

        public ApiResponse(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public ApiResponse(boolean success, String message, Object data) {
            this.success = success;
            this.message = message;
            this.data    = data;
        }

        public boolean isSuccess()          { return success; }
        public void    setSuccess(boolean s){ this.success = s; }

        public String  getMessage()         { return message; }
        public void    setMessage(String m) { this.message = m; }

        public Object  getData()            { return data; }
        public void    setData(Object d)    { this.data = d; }
    }

    // Tambahkan class ini di dalam public class UserDto kalian, bro
    public static class UpdateProfileRequest {
        private String email;
        private String namaLengkap;

        // Getters & Setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getNamaLengkap() { return namaLengkap; }
        public void setNamaLengkap(String namaLengkap) { this.namaLengkap = namaLengkap; }
    }
}
