package com.keuangan.app.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.keuangan.app.dto.ExpenseRequest;
import com.keuangan.app.model.Transaction;
import com.keuangan.app.repository.CategoryRepository;
import com.keuangan.app.repository.TransactionRepository;

@Service
@Transactional
public class ExpenseService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<Transaction> getAllExpenses(String userId) {
        return transactionRepository.findByUserIdOrderByDateDescIdDesc(userId).stream()
                .filter(t -> "EXPENSE".equalsIgnoreCase(t.getType()))
                .collect(Collectors.toList());
    }

    public String createExpense(ExpenseRequest request, String userId) {
        // 1. Validasi Aturan Angka (Menggunakan getNominal)
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Nominal pengeluaran harus lebih besar dari 0");
        }

        // 2. Validasi Kategori via Tabel Bersama (Menggunakan getKategori)
        categoryRepository.findByNameIgnoreCaseAndType(request.getKategori(), "EXPENSE")
                .orElseThrow(() -> new IllegalArgumentException("Kategori '" + request.getKategori() + "' tidak valid untuk pengeluaran"));

        // OPTIMASI: Mengambil saldo langsung via agregasi database untuk menghindari OutOfMemory (OOM) pada skala data besar
        BigDecimal currentBalance = transactionRepository.getRealtimeBalance(userId);

        if (currentBalance == null) {
            currentBalance = BigDecimal.ZERO;
        }

        // 3. Pengecekan Batas Saldo Minus (Menggunakan getNominal dan isForceSave)
        if (currentBalance.compareTo(request.getAmount()) < 0 && !request.isForceSave()) {
            throw new IllegalStateException("WARNING_INSUFFICIENT_BALANCE");
        }

        // 4. Eksekusi Simpan (Sekarang menggunakan setter Bahasa Indonesia)
        Transaction t = new Transaction();
        t.setUserId(userId);
        t.setType("EXPENSE");
        t.setKategori(request.getKategori());
        t.setNominal(request.getAmount());
        t.setKeterangan(request.getKeterangan());
        t.setTanggal(LocalDateTime.now());
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

        // Menggunakan getNominal
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Nominal pengeluaran harus lebih besar dari 0");
        }

        // Menggunakan getKategori
        categoryRepository.findByNameIgnoreCaseAndType(request.getKategori(), "EXPENSE")
                .orElseThrow(() -> new IllegalArgumentException("Kategori '" + request.getKategori() + "' tidak valid untuk pengeluaran"));

        BigDecimal currentBalance = transactionRepository.getRealtimeBalance(userId);
        // Menggunakan getNominal dan isForceSave
        if (currentBalance.compareTo(request.getAmount()) < 0 && !request.isForceSave()) {
            throw new IllegalStateException("WARNING_INSUFFICIENT_BALANCE");
        }

        // Update data (Sekarang menggunakan setter Bahasa Indonesia)
        t.setNominal(request.getAmount());
        t.setKategori(request.getKategori());
        t.setKeterangan(request.getKeterangan());
        t.setTanggal(LocalDateTime.now());
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