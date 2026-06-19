package com.keuangan.app.config;

import com.keuangan.app.enums.UserRole;
import com.keuangan.app.enums.UserStatus;
import com.keuangan.app.model.User;
import com.keuangan.app.model.Category;
import com.keuangan.app.repository.CategoryRepository;
import com.keuangan.app.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;

    public DataInitializer(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           CategoryRepository categoryRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) {

        System.out.println("DataInitializer dijalankan");

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
            System.out.println("Jumlah user = " + userRepository.count());
        }

        if (categoryRepository.count() == 0) {
            
            // Kategori Pengeluaran (EXPENSE)
            categoryRepository.save(new Category("Makanan", "EXPENSE"));
            categoryRepository.save(new Category("Transport", "EXPENSE"));
            categoryRepository.save(new Category("Kuliah", "EXPENSE"));
            categoryRepository.save(new Category("Hiburan", "EXPENSE"));

            // Kategori Pemasukan (INCOME)
            categoryRepository.save(new Category("Gaji", "INCOME"));
            categoryRepository.save(new Category("Tunjangan", "INCOME"));
            categoryRepository.save(new Category("Investasi", "INCOME"));
            
            System.out.println("✅ Data master kategori berhasil ditambahkan otomatis!");
        }
    }
}
