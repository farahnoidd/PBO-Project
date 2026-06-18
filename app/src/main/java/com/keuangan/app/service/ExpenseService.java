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

    @Transactional(readOnly = true)
    public List<Transaction> getAllTransactions(String userId) {
        return transactionRepository.findByUserId(userId);
    }

    public String createExpense(ExpenseRequest request, String userId) {
        // 1. Validasi Aturan Angka
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Nominal pengeluaran harus lebih besar dari 0");
        }

        // 2. Validasi Kategori via Tabel Bersama (Wajib tipe EXPENSE)
        categoryRepository.findByNameIgnoreCaseAndType(request.getCategory(), "EXPENSE")
                .orElseThrow(() -> new IllegalArgumentException("Kategori '" + request.getCategory() + "' tidak valid untuk pengeluaran"));

        // OPTIMASI: Mengambil saldo langsung via agregasi database untuk menghindari OutOfMemory (OOM) pada skala data besar
        BigDecimal currentBalance = transactionRepository.getRealtimeBalance(userId);

        if (currentBalance == null) {
            currentBalance = BigDecimal.ZERO;
        }

        // 3. Pengecekan Batas Saldo Minus
        if (currentBalance.compareTo(request.getAmount()) < 0 && !request.isForceSave()) {
            throw new IllegalStateException("WARNING_INSUFFICIENT_BALANCE");
        }

        // 4. Eksekusi Simpan
        Transaction t = new Transaction();
        t.setUserId(userId);
        t.setType("EXPENSE");
        t.setCategory(request.getCategory());
        t.setAmount(request.getAmount());
        t.setDescription(request.getDescription());
        t.setDate(request.getDate());
        t.setAkun(request.getAkun());

        transactionRepository.save(t);
        return "Pengeluaran berhasil dicatat" + (currentBalance.compareTo(request.getAmount()) < 0 ? " (Saldo Anda Minus!)" : "");
    }

    public Transaction updateExpense(Long id, ExpenseRequest request, String userId) {
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Data pengeluaran tidak ditemukan"));

        if (!t.getUserId().equals(userId)) {
            throw new SecurityException("Akses ditolak: Anda tidak berhak mengubah data ini");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Nominal pengeluaran harus lebih besar dari 0");
        }

        categoryRepository.findByNameIgnoreCaseAndType(request.getCategory(), "EXPENSE")
                .orElseThrow(() -> new IllegalArgumentException("Kategori '" + request.getCategory() + "' tidak valid untuk pengeluaran"));

        BigDecimal currentBalance = transactionRepository.getRealtimeBalance(userId);
        if (currentBalance.compareTo(request.getAmount()) < 0 && !request.isForceSave()) {
            throw new IllegalStateException("WARNING_INSUFFICIENT_BALANCE");
        }

        t.setAmount(request.getAmount());
        t.setCategory(request.getCategory());
        t.setDescription(request.getDescription());
        t.setDate(request.getDate());
        t.setAkun(request.getAkun());

        return transactionRepository.save(t);
    }

    public void deleteExpense(Long id, String userId) {
        Transaction t = transactionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Data pengeluaran tidak ditemukan"));

    if (!t.getUserId().equals(userId)) {
        throw new SecurityException("Akses ditolak: Anda tidak berhak menghapus data ini");
    }

    transactionRepository.delete(t);
    }
}