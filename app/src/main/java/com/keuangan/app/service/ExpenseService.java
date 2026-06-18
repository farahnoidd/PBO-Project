package com.keuangan.app.service;

import com.keuangan.app.dto.ExpenseRequest;
import com.keuangan.app.model.Transaction;
import com.keuangan.app.repository.CategoryRepository;
import com.keuangan.app.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class ExpenseService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public String createExpense(ExpenseRequest request) {
        // 1. Validasi Aturan Angka
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Nominal pengeluaran harus lebih besar dari 0");
        }

        // 2. Validasi Kategori via Tabel Bersama (Wajib tipe EXPENSE)
        categoryRepository.findByNameIgnoreCaseAndType(request.getCategory(), "EXPENSE")
                .orElseThrow(() -> new IllegalArgumentException("Kategori '" + request.getCategory() + "' tidak valid untuk pengeluaran"));

        // ==================== BARU: PROSES HITUNG SALDO RIIL ====================
        // A. Tarik semua data transaksi si user dari database
        List<Transaction> userTransactions = transactionRepository.findByUserId(request.getUserId());

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        // B. Looping untuk menghitung total pemasukan & pengeluaran asli dia
        for (Transaction t : userTransactions) {
            if ("INCOME".equalsIgnoreCase(t.getType())) {
                totalIncome = totalIncome.add(t.getAmount());
            } else if ("EXPENSE".equalsIgnoreCase(t.getType())) {
                totalExpense = totalExpense.add(t.getAmount());
            }
        }

        // C. Saldo riil adalah hasil pengurangan total tersebut
        BigDecimal currentBalance = totalIncome.subtract(totalExpense);
        // ========================================================================

        // 3. Pengecekan Batas Saldo Minus
        if (currentBalance.compareTo(request.getAmount()) < 0 && !request.isForceSave()) {
            throw new IllegalStateException("WARNING_INSUFFICIENT_BALANCE");
        }

        // 4. Eksekusi Simpan
        Transaction t = new Transaction();
        t.setUserId(request.getUserId());
        t.setType("EXPENSE");
        t.setCategory(request.getCategory());
        t.setAmount(request.getAmount());
        t.setDescription(request.getDescription());
        t.setDate(request.getDate());
        t.setAkun(request.getAkun());

        transactionRepository.save(t);
        return "Pengeluaran berhasil dicatat" + (currentBalance.compareTo(request.getAmount()) < 0 ? " (Saldo Anda Minus!)" : "");
    }

    public Transaction updateExpense(Long id, ExpenseRequest request) {
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Data pengeluaran tidak ditemukan"));

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Nominal pengeluaran harus lebih besar dari 0");
        }

        t.setAmount(request.getAmount());
        t.setCategory(request.getCategory());
        t.setDescription(request.getDescription());
        t.setDate(request.getDate());
        t.setAkun(request.getAkun());

        return transactionRepository.save(t);
    }

    public void deleteExpense(Long id) {
        if (!transactionRepository.existsById(id)) {
            throw new IllegalArgumentException("Data pengeluaran tidak ditemukan");
        }
        transactionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
}