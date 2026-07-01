package com.keuangan.app.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class OtpService {

    @Value("${app.mail.sender}")
    private String fromEmail;

    private final JavaMailSender mailSender;
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public OtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void generateAndSend(String username, String email) {
        String otp = String.format("%06d", random.nextInt(999999));
        otpStore.put(username, new OtpEntry(otp, LocalDateTime.now().plusMinutes(5)));
        sendEmail(email, otp);
    }

    public boolean verify(String username, String inputOtp) {
        OtpEntry entry = otpStore.get(username);
        if (entry == null) return false;
        if (LocalDateTime.now().isAfter(entry.expiry)) {
            otpStore.remove(username);
            return false;
        }
        boolean valid = entry.otp.equals(inputOtp);
        if (valid) otpStore.remove(username);
        return valid;
    }

    private void sendEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Kode OTP FinanceBuddy");
            helper.setText(buildEmailHtml(otp), true);
            mailSender.send(message);
            log.info("OTP email terkirim ke {}", toEmail);
        } catch (Exception e) {
            log.error("Gagal mengirim OTP ke {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Gagal mengirim email OTP. Error SMTP: " + e.getMessage(), e);
        }
    }

    private String buildEmailHtml(String otp) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;
                        background:#f5f6f8;border-radius:16px;">
              <div style="background:white;border-radius:12px;padding:32px;text-align:center;
                          box-shadow:0 2px 10px rgba(0,0,0,0.06);">
                <h2 style="color:#366758;margin-bottom:8px;">FinanceBuddy</h2>
                <p style="color:#555;font-size:14px;margin-bottom:24px;">
                  Gunakan kode OTP berikut untuk masuk ke akun Anda.
                </p>
                <div style="background:#f0faf6;border:2px dashed #9dd1bf;border-radius:12px;
                            padding:20px;margin-bottom:24px;">
                  <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#366758;">
                    %s
                  </div>
                </div>
                <p style="color:#888;font-size:12px;">
                  Kode berlaku selama <strong>5 menit</strong>.<br>
                  Jangan bagikan kode ini kepada siapapun.
                </p>
              </div>
            </div>
            """.formatted(otp);
    }

    private record OtpEntry(String otp, LocalDateTime expiry) {}
}