package com.keuangan.app.controller;

import com.keuangan.app.dto.IncomeRequest;
import com.keuangan.app.service.IncomeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/incomes")
@CrossOrigin(origins = "*")
public class IncomeController {

    @Autowired
    private IncomeService incomeService;

    @PostMapping
    public ResponseEntity<Map<String, String>> createIncome(
            Authentication authentication, 
            @RequestBody IncomeRequest request) { // PERBAIKAN: Sekarang request JSON-nya udah ketangkap
        
        Map<String, String> response = new HashMap<>();
        try {
            // PERBAIKAN: Ambil userId asli dari token JWT secara aman
            String userId = authentication.getName(); 
            
            // Oper data request DAN userId ke service
            String result = incomeService.saveIncome(request, userId);
            
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