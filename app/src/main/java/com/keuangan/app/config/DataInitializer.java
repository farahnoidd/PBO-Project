package com.keuangan.app.config;

import com.keuangan.app.enums.UserRole;
import com.keuangan.app.enums.UserStatus;
import com.keuangan.app.model.User;
import com.keuangan.app.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    public DataInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {

        if (userRepository.count() == 0) {

            User admin = new User();

            admin.setUsername("admin");
            admin.setEmail("admin@financebuddy.com");
            admin.setPassword("admin123");
            admin.setNamaLengkap("Administrator");

            admin.setRole(UserRole.ADMIN);
            admin.setStatus(UserStatus.TERVALIDASI);

            userRepository.save(admin);
        }
    }
}
