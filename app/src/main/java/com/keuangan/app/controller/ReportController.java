package com.keuangan.app.controller;

import com.keuangan.app.dto.response.DashboardResponseDTO;
import com.keuangan.app.dto.response.MonthlyChartDTO;
import com.keuangan.app.dto.response.YearlyChartDTO;
import com.keuangan.app.service.ReportService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/laporan/dashboard")
    public ResponseEntity<DashboardResponseDTO> getDashboard(Authentication authentication) {
        String userId = authentication.getName(); 
        
        DashboardResponseDTO summary = reportService.getDashboardSummary(userId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/laporan/bulanan")
    public ResponseEntity<List<MonthlyChartDTO>> getLaporanBulanan(
            Authentication authentication,
            @RequestParam(value = "bulan", required = false) Integer bulan,
            @RequestParam(value = "tahun", required = false, defaultValue = "2026") Integer tahun) {

        String userId = authentication.getName();
        List<MonthlyChartDTO> monthlyData = reportService.getMonthlyChart(userId, tahun);
        return ResponseEntity.ok(monthlyData);
    }

    @GetMapping("/laporan/tahunan")
    public ResponseEntity<YearlyChartDTO> getLaporanTahunan(
            Authentication authentication,
            @RequestParam(value = "tahun", required = false, defaultValue = "2026") Integer tahun) {
            
        String userId = authentication.getName();
        YearlyChartDTO yearlyData = reportService.getYearlyChartData(userId, tahun); 
        return ResponseEntity.ok(yearlyData);
    }
}