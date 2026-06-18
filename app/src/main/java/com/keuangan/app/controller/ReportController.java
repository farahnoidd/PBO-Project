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

    @GetMapping("/api/report/dashboard")
    public ResponseEntity<DashboardResponseDTO> getDashboard(Authentication authentication) {
        String userId = authentication.getName(); 
        
        DashboardResponseDTO summary = reportService.getDashboardSummary(userId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/api/report/monthly-chart")
    public ResponseEntity<List<MonthlyChartDTO>> getMonthlyChart(
            Authentication authentication,
            @RequestParam Integer year) {

        String userId = authentication.getName();
        List<MonthlyChartDTO> monthlyData = reportService.getMonthlyChart(userId, year);
        return ResponseEntity.ok(monthlyData);
    }

    @GetMapping("/api/report/yearly-chart")
    public ResponseEntity<List<YearlyChartDTO>> getYearlyChart(Authentication authentication) {
        String userId = authentication.getName();
        List<YearlyChartDTO> yearlyData = reportService.getYearlyChart(userId);
        return ResponseEntity.ok(yearlyData);
    }               
}