package com.keuangan.app.service;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.keuangan.app.dto.IncomeRequest;
import com.keuangan.app.model.Transaction;
import com.keuangan.app.repository.CategoryRepository;
import com.keuangan.app.repository.TransactionRepository;

@Service
@Transactional
public class IncomeService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public String saveIncome(IncomeRequest request, String userId) {
        // 1. Validasi Angka
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Nominal pemasukan harus lebih besar dari 0");
        }

        // 2. Validasi Kategori Bersama (Wajib bertipe INCOME)
        categoryRepository.findByNameIgnoreCaseAndType(request.getCategory(), "INCOME")
                .orElseThrow(() -> new IllegalArgumentException("Kategori '" + request.getCategory() + "' tidak valid untuk pemasukan"));

        // 3. Mapping ke Entity Transaction
        Transaction t = new Transaction();
        t.setUserId(userId);
        t.setType("INCOME");
        t.setCategory(request.getCategory());
        t.setAmount(request.getAmount());
        t.setDescription(request.getDescription());
        t.setDate(request.getDate());
        t.setAkun(request.getAkun());

        transactionRepository.save(t);
        
        return "Pemasukan berhasil dicatat, saldo Anda bertambah!";
    }

    public Transaction updateIncome(Long id, IncomeRequest request, String userId) {
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Data pemasukan tidak ditemukan"));

        // KEAMANAN IDOR: Cek apakah transaksi ini benar milik user yang sedang login
        if (!t.getUserId().equals(userId)) {
            throw new SecurityException("Akses ditolak: Anda tidak berhak mengubah data ini");
        }

        // Validasi Angka
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Nominal pemasukan harus lebih besar dari 0");
        }

        // Validasi Kategori
        categoryRepository.findByNameIgnoreCaseAndType(request.getCategory(), "INCOME")
                .orElseThrow(() -> new IllegalArgumentException("Kategori '" + request.getCategory() + "' tidak valid untuk pemasukan"));

        // Update data
        t.setAmount(request.getAmount());
        t.setCategory(request.getCategory());
        t.setDescription(request.getDescription());
        t.setDate(request.getDate());
        t.setAkun(request.getAkun());

        return transactionRepository.save(t);
    }

    public void deleteIncome(Long id, String userId) {
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Data pemasukan tidak ditemukan"));

        // KEAMANAN IDOR: Cek apakah transaksi ini benar milik user yang sedang login
        if (!t.getUserId().equals(userId)) {
            throw new SecurityException("Akses ditolak: Anda tidak berhak menghapus data ini");
        }

        transactionRepository.delete(t);
    }
}