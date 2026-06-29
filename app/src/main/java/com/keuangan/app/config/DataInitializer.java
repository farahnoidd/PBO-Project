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

        ensureCategoryExists(allCategories, "MAKANAN", "EXPENSE", "admin");
        ensureCategoryExists(allCategories, "TRANSPORTASI", "EXPENSE", "admin");
        ensureCategoryExists(allCategories, "BELAJAR", "EXPENSE", "admin");
        ensureCategoryExists(allCategories, "KOST", "EXPENSE", "admin");
        ensureCategoryExists(allCategories, "HIBURAN", "EXPENSE", "admin");
        ensureCategoryExists(allCategories, "TAGIHAN", "EXPENSE", "admin");

        ensureCategoryExists(allCategories, "UANG SAKU", "INCOME", "admin");
        ensureCategoryExists(allCategories, "GAJI PART TIME", "INCOME", "admin");
        ensureCategoryExists(allCategories, "FREELANCE", "INCOME", "admin");
        ensureCategoryExists(allCategories, "BONUS", "INCOME", "admin");

        System.out.println("Data master kategori aman terkendali!");
    }

    private void ensureCategoryExists(List<Category> existingCategories, String name, String type, String userId) {
        Category existing = existingCategories.stream()
                .filter(c -> c.getName() != null && c.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElse(null);

        if (existing == null) {
            // Kondisi A: Jika benar-benar belum ada di database, lakukan INSERT baru
            categoryRepository.save(new Category(name, type, userId));
            System.out.println("Kategori baru berhasil ditambahkan: " + name + " (" + type + ")");
        } else {
            // Kondisi B: Jika namanya sudah ada, lakukan DATA HEALING jika isinya belum standar admin
            boolean perluUpdate = false;

            // Perbaiki userId jika masih null atau bukan "admin"
            if (existing.getUserId() == null || !existing.getUserId().equals(userId)) {
                existing.setUserId(userId);
                perluUpdate = true;
            }

            // Perbaiki type jika masih null atau tidak sesuai (misal INCOME/EXPENSE tertukar)
            if (existing.getType() == null || !existing.getType().equalsIgnoreCase(type)) {
                existing.setType(type);
                perluUpdate = true;
            }

            // Eksekusi update ke database jika ada data yang diperbaiki
            if (perluUpdate) {
                categoryRepository.save(existing);
                System.out.println("Data lama disinkronisasi (UserId/Type di-update): " + name);
            } else {
                System.out.println("Kategori dilewati (Sudah sesuai standar): " + name);
            }
        }
    }
}