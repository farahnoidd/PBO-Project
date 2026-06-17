package com.keuangan.app.controller;

import com.keuangan.app.dto.IncomeRequest;
import com.keuangan.app.service.IncomeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/incomes")
@CrossOrigin(origins = "*")    // Agar bisa ditembak oleh tim Frontend
public class IncomeController {

    @Autowired
    private IncomeService incomeService;

    @PostMapping
    public ResponseEntity<Map<String, String>> createIncome(@RequestBody IncomeRequest request) {
        Map<String, String> response = new HashMap<>();
        try {
            String result = incomeService.saveIncome(request);
            response.put("status", "Success");
            response.put("message", result);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "Failed");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}