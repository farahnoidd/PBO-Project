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
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByDateDescIdDesc(userId);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (Transaction t : transactions) {
            // Menyelaraskan dengan getAmount() pada model Transaction yang baru
            if ("INCOME".equalsIgnoreCase(t.getType())) {
                totalIncome = totalIncome.add(t.getAmount());
            }
            if ("EXPENSE".equalsIgnoreCase(t.getType())) {
                totalExpense = totalExpense.add(t.getAmount());
            }
        }

        double saldo = totalIncome.subtract(totalExpense).doubleValue();

        return new DashboardResponseDTO(
                totalIncome.doubleValue(),
                totalExpense.doubleValue(),
                saldo
        );
    }

    public List<MonthlyChartDTO> getMonthlyChart(String userId, Integer year) {
        List<Object[]> results = transactionRepository.getMonthlySummary(userId, year);
        List<MonthlyChartDTO> charts = new ArrayList<>();

        for (Object[] row : results) {
            Integer monthNumber = (Integer) row[0];
            String type = (String) row[1];
            BigDecimal amount = (BigDecimal) row[2];

            String month = String.valueOf(monthNumber);

            MonthlyChartDTO dto = charts.stream()
                    .filter(c -> c.getBulan().equals(month))
                    .findFirst()
                    .orElse(null);

            if (dto == null) {
                dto = new MonthlyChartDTO(month, 0, 0);
                charts.add(dto);
            }

            if ("INCOME".equalsIgnoreCase(type)) {
                dto.setPemasukan(amount.doubleValue());
            }
            if ("EXPENSE".equalsIgnoreCase(type)) {
                dto.setPengeluaran(amount.doubleValue());
            }
        }
        return charts;
    }

    public YearlyChartDTO getYearlyChartData(String userId, Integer yearParam) {
        List<MonthlyChartDTO> grafikBulanan = getMonthlyChart(userId, yearParam);

        double totalPemasukan = 0;
        double totalPengeluaran = 0;

        for (MonthlyChartDTO m : grafikBulanan) {
            totalPemasukan += m.getPemasukan();
            totalPengeluaran += m.getPengeluaran();
        }

        YearlyChartDTO report = new YearlyChartDTO();
        report.setTotalPemasukan(totalPemasukan);
        report.setTotalPengeluaran(totalPengeluaran);
        report.setBulanPengeluaranTertinggi("Desember");
        report.setKategoriTerbesar("Makanan");
        report.setGrafikBulanan(grafikBulanan);
        report.setGrafikKategori(new ArrayList<>());

        return report;
    }
}