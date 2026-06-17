package com.keuangan.app.service;

import com.keuangan.app.dto.IncomeRequest;
import com.keuangan.app.model.Transaction;
import com.keuangan.app.repository.CategoryRepository;
import com.keuangan.app.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
@Transactional
public class IncomeService {

    @Autowired
    private TransactionRepository transactionRepository; // Menggunakan repo bersama

    @Autowired
    private CategoryRepository categoryRepository;       // Menggunakan repo bersama

    public String saveIncome(IncomeRequest request) {
        // 1. Validasi Angka
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Nominal pemasukan harus lebih besar dari 0");
        }

        // 2. Validasi Kategori Bersama (Wajib bertipe INCOME)
        categoryRepository.findByNameIgnoreCaseAndType(request.getCategory(), "INCOME")
                .orElseThrow(() -> new IllegalArgumentException("Kategori '" + request.getCategory() + "' tidak valid untuk pemasukan"));

        // 3. Mapping ke Entity Transaction
        Transaction t = new Transaction();
        t.setUserId(request.getUserId());
        t.setType("INCOME"); // Kunci pembeda dengan modul pengeluaranmu
        t.setCategory(request.getCategory());
        t.setAmount(request.getAmount());
        t.setDescription(request.getDescription());
        t.setDate(request.getDate());
        t.setAkun(request.getAkun());

        transactionRepository.save(t);
        
        return "Pemasukan berhasil dicatat, saldo Anda bertambah!";
    }
}