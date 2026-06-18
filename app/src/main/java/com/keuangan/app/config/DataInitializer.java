package com.keuangan.app.config;

import com.keuangan.app.enums.UserRole;
import com.keuangan.app.enums.UserStatus;
import com.keuangan.app.model.User;
import com.keuangan.app.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        if (userRepository.count() == 0) {

            User admin = new User();

            admin.setUsername("admin");
            admin.setEmail("admin@financebuddy.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setNamaLengkap("Administrator");

            admin.setRole(UserRole.ADMIN);
            admin.setStatus(UserStatus.TERVALIDASI);

            userRepository.save(admin);

            System.out.println("Admin default berhasil dibuat.");
        }
    }
}