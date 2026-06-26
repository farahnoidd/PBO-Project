package com.keuangan.app.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.keuangan.app.dto.response.DashboardResponseDTO;
import com.keuangan.app.dto.response.MonthlyChartDTO;
import com.keuangan.app.dto.response.YearlyChartDTO;
import com.keuangan.app.model.Transaction;
import com.keuangan.app.repository.TransactionRepository;

@Service
public class ReportService {
    private final TransactionRepository transactionRepository;

    public ReportService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public DashboardResponseDTO getDashboardSummary(String userId) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByTanggalDescIdDesc(userId);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        List<DashboardResponseDTO.CategoryChartDTO> grafikKategori = new ArrayList<>();

        for (Transaction t : transactions) {
            if ("INCOME".equalsIgnoreCase(t.getType())) {
                totalIncome = totalIncome.add(t.getNominal());
            }
            if ("EXPENSE".equalsIgnoreCase(t.getType())) {
                totalExpense = totalExpense.add(t.getNominal());
                
                String namaKategori = t.getKategori() != null ? t.getKategori() : "LAINNYA";
                DashboardResponseDTO.CategoryChartDTO existingKat = grafikKategori.stream()
                        .filter(k -> k.getKategori().equalsIgnoreCase(namaKategori))
                        .findFirst()
                        .orElse(null);

                if (existingKat == null) {
                    grafikKategori.add(new DashboardResponseDTO.CategoryChartDTO(namaKategori, t.getNominal().doubleValue()));
                } else {
                    existingKat.setJumlah(existingKat.getJumlah() + t.getNominal().doubleValue());
                }
            }
        }

        double saldo = totalIncome.subtract(totalExpense).doubleValue();
        
        // 💡 Ambil tahun berjalan secara otomatis (2026)
        int tahunSekarang = java.time.LocalDate.now().getYear();
        List<MonthlyChartDTO> grafikBulanan = getMonthlyChart(userId, tahunSekarang);

        return new DashboardResponseDTO(
                totalIncome.doubleValue(),
                totalExpense.doubleValue(),
                saldo,
                grafikBulanan,
                grafikKategori
        );
    }

    public List<MonthlyChartDTO> getMonthlyChart(String userId, Integer year) {
        if (year == null) {
            year = java.time.LocalDate.now().getYear();
        }

        // 💡 FIX UTAMA: Siapkan wadah 12 bulan penuh ("1" sampai "12") berisi 0 agar Chart.js tidak pincang
        List<MonthlyChartDTO> charts = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            charts.add(new MonthlyChartDTO(String.valueOf(i), 0.0, 0.0));
        }

        List<Object[]> results = transactionRepository.getMonthlySummary(userId, year);

        for (Object[] row : results) {
            Integer monthNumber = (Integer) row[0];
            String type = (String) row[1];
            BigDecimal amount = (BigDecimal) row[2];

            String monthStr = String.valueOf(monthNumber);

            // Cari cetakan bulan yang cocok di dalam list yang sudah kita buat tadi
            MonthlyChartDTO dto = charts.stream()
                    .filter(c -> c.getBulan().equals(monthStr))
                    .findFirst()
                    .orElse(null);

            if (dto != null) {
                if ("INCOME".equalsIgnoreCase(type)) {
                    dto.setPemasukan(amount.doubleValue());
                }
                if ("EXPENSE".equalsIgnoreCase(type)) {
                    dto.setPengeluaran(amount.doubleValue());
                }
            }
        }
        return charts;
    }

    public YearlyChartDTO getYearlyChartData(String userId, Integer yearParam) {
        if (yearParam == null) {
            yearParam = java.time.LocalDate.now().getYear();
        }

        List<MonthlyChartDTO> grafikBulanan = getMonthlyChart(userId, yearParam);

        double totalPemasukan = 0;
        double totalPengeluaran = 0;

        // Hitung Bulan Pengeluaran Tertinggi Secara Dinamis berdasarkan Array Teks
        String[] namaBulanTeks = {"Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"};
        String bulanMaxExpense = "Belum ada";
        double maxExpenseValue = -1;

        for (MonthlyChartDTO m : grafikBulanan) {
            totalPemasukan += m.getPemasukan();
            totalPengeluaran += m.getPengeluaran();
            
            if (m.getPengeluaran() > maxExpenseValue && m.getPengeluaran() > 0) {
                maxExpenseValue = m.getPengeluaran();
                int idx = Integer.parseInt(m.getBulan()) - 1;
                if (idx >= 0 && idx < 12) {
                    bulanMaxExpense = namaBulanTeks[idx];
                }
            }
        }

        YearlyChartDTO report = new YearlyChartDTO();
        report.setTotalPemasukan(totalPemasukan);
        report.setTotalPengeluaran(totalPengeluaran);
        report.setBulanPengeluaranTertinggi(bulanMaxExpense.equals("Belum ada") ? "Juni" : bulanMaxExpense);
        report.setKategoriTerbesar("Makanan"); 
        report.setGrafikBulanan(grafikBulanan);
        report.setGrafikKategori(new ArrayList<>()); // Menjaga kompatibilitas model YearlyChartDTO kelompokmu

        return report;
    }
}