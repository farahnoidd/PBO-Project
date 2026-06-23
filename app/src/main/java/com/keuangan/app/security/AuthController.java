package com.keuangan.app.security;

import com.keuangan.app.dto.*;
import com.keuangan.app.model.User;
import com.keuangan.app.repository.UserRepository;
import com.keuangan.app.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ── STEP 1: Verifikasi password → kirim OTP ke Email ─────────────────────

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody LoginRequest request) {
        // ① Verifikasi username + password
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        // ② Ambil email user dari database
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));

        // ③ Kirim OTP ke email user
        String email = user.getEmail();
        otpService.generateAndSend(request.getUsername(), email);

        // Samarkan sebagian email untuk tampilan (mis: f***@gmail.com)
        String maskedEmail = maskEmail(email);

        return ResponseEntity.ok(Map.of(
            "message", "OTP telah dikirim ke email " + maskedEmail + ". Berlaku 5 menit.",
            "username", request.getUsername(),
            "maskedEmail", maskedEmail
        ));
    }

    // ── STEP 2: Verifikasi OTP → kembalikan JWT ───────────────────────────────

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        if (!otpService.verify(request.getUsername(), request.getOtp())) {
            return ResponseEntity.badRequest().body(Map.of("error", "OTP tidak valid atau sudah expired"));
        }

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .findFirst().orElse("ROLE_USER");

        return ResponseEntity.ok(JwtResponse.builder()
            .token(jwt)
            .id(userDetails.getId())
            .username(userDetails.getUsername())
            .email(userDetails.getEmail())
            .role(role)
            .build());
    }

    // ── Login lama tanpa OTP (opsional, bisa dihapus) ────────────────────────

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .findFirst().orElse("ROLE_USER");

        return ResponseEntity.ok(JwtResponse.builder()
            .token(jwt)
            .id(userDetails.getId())
            .username(userDetails.getUsername())
            .email(userDetails.getEmail())
            .role(role)
            .build());
    }

    // ── Helper: samarkan email (f***@gmail.com) ───────────────────────────────

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@");
        String name = parts[0];
        String domain = parts[1];
        if (name.length() <= 2) return name.charAt(0) + "***@" + domain;
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + domain;
    }
}