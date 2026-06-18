package com.keuangan.app.controller;

import com.keuangan.app.dto.response.DashboardResponseDTO;
import com.keuangan.app.dto.response.MonthlyChartDTO;
import com.keuangan.app.dto.response.YearlyChartDTO;
import com.keuangan.app.service.ReportService;

import org.springframework.http.ResponseEntity;
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
    public DashboardResponseDTO getDashboard(@RequestParam String userId) {
        return reportService.getDashboardSummary(userId);
    }
    @GetMapping("/api/report/monthly-chart")
    public ResponseEntity<List<MonthlyChartDTO>> getMonthlyChart(
            @RequestParam String userId,
            @RequestParam Integer year) {

        List<MonthlyChartDTO> monthlyData = reportService.getMonthlyChart(userId, year);
        return ResponseEntity.ok(monthlyData);
    }
    @GetMapping("/api/report/yearly-chart")
    public ResponseEntity<List<YearlyChartDTO>> getYearlyChart(@RequestParam String userId) {
        List<YearlyChartDTO> yearlyData = reportService.getYearlyChart(userId);
        return ResponseEntity.ok(yearlyData);
    }               
}