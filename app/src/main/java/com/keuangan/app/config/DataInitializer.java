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

        // 1. SEEDING USER ADMIN
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

        // 2. SEEDING KATEGORI MASTER (Menggunakan Helper Method Anti-Skip)
        System.out.println("Memeriksa data master kategori...");
        
        // Kategori Pengeluaran (EXPENSE)
        ensureCategoryExists("MAKANAN", "EXPENSE");
        ensureCategoryExists("TRANSPORTASI", "EXPENSE");
        ensureCategoryExists("HIBURAN", "EXPENSE");
        ensureCategoryExists("TAGIHAN", "EXPENSE");
        ensureCategoryExists("LAINNYA_PENGELUARAN", "EXPENSE");

        // Kategori Pemasukan (INCOME)
        ensureCategoryExists("UANG_SAKU", "INCOME");
        ensureCategoryExists("GAJI_PART_TIME", "INCOME");
        ensureCategoryExists("FREELANCE", "INCOME");
        ensureCategoryExists("BONUS", "INCOME");
        ensureCategoryExists("LAINNYA_PEMASUKAN", "INCOME");

        System.out.println("Data master kategori aman terkendali!");
    }

    /**
     * 💡 HELPER METHOD: Berfungsi untuk mengecek kategori satu per satu ke database.
     * Jika belum ada, baru akan disimpan. Jika sudah ada, akan dilewati tanpa bikin crash.
     */
    private void ensureCategoryExists(String name, String type) {
        if (categoryRepository.findByNameIgnoreCaseAndType(name, type).isEmpty()) {
            categoryRepository.save(new Category(name, type));
            System.out.println("Kategori baru berhasil ditambahkan: " + name + " (" + type + ")");
        }
    }
}
