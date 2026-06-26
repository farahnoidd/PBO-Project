package com.keuangan.app.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.keuangan.app.enums.UserRole;
import com.keuangan.app.enums.UserStatus;
import com.keuangan.app.model.Category;
import com.keuangan.app.model.User;
import com.keuangan.app.repository.CategoryRepository;
import com.keuangan.app.repository.UserRepository;

import java.util.List;

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
        System.out.println("DataInitializer dijalankan...");

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

        System.out.println("Memeriksa data master kategori...");
        
        List<Category> allCategories = categoryRepository.findAll();

        ensureCategoryExists(allCategories, "MAKANAN", "EXPENSE");
        ensureCategoryExists(allCategories, "TRANSPORTASI", "EXPENSE");
        ensureCategoryExists(allCategories, "BELAJAR", "EXPENSE");
        ensureCategoryExists(allCategories, "KOST", "EXPENSE");
        ensureCategoryExists(allCategories, "HIBURAN", "EXPENSE");
        ensureCategoryExists(allCategories, "TAGIHAN", "EXPENSE");
        ensureCategoryExists(allCategories, "LAINNYA_PENGELUARAN", "EXPENSE");

        ensureCategoryExists(allCategories, "UANG_SAKU", "INCOME");
        ensureCategoryExists(allCategories, "GAJI_PART_TIME", "INCOME");
        ensureCategoryExists(allCategories, "FREELANCE", "INCOME");
        ensureCategoryExists(allCategories, "BONUS", "INCOME");
        ensureCategoryExists(allCategories, "LAINNYA_PEMASUKAN", "INCOME");

        System.out.println("Data master kategori aman terkendali!");
    }

    private void ensureCategoryExists(List<Category> existingCategories, String name, String type) {
        boolean exists = existingCategories.stream()
                .anyMatch(c -> c.getName() != null && c.getName().equalsIgnoreCase(name) 
                            && c.getType() != null && c.getType().equalsIgnoreCase(type));

        if (!exists) {
            categoryRepository.save(new Category(name, type));
            System.out.println("Kategori baru berhasil ditambahkan: " + name + " (" + type + ")");
        }
    }
}