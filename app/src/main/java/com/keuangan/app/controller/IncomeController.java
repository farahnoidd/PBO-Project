package com.keuangan.app.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.keuangan.app.dto.IncomeRequest;
import com.keuangan.app.model.Transaction;
import com.keuangan.app.service.IncomeService;

@RestController
@RequestMapping("/api/transaksi/pemasukan")
@CrossOrigin(origins = "*")
public class IncomeController {

    @Autowired
    private IncomeService incomeService;

    @GetMapping
    public ResponseEntity<List<Transaction>> getTransactions(Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(incomeService.getAllIncomes(userId));
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createIncome(
            Authentication authentication, 
            @RequestBody IncomeRequest request) { 
        
        Map<String, String> response = new HashMap<>();
        try {
            String userId = authentication.getName(); 
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

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, String>> updateIncome(
            @PathVariable Long id, 
            @RequestBody IncomeRequest request,
            Authentication authentication) {
        
        Map<String, String> response = new HashMap<>();
        try {
            String userId = authentication.getName();
            incomeService.updateIncome(id, request, userId);
            
            response.put("status", "Success");
            response.put("message", "Data pemasukan berhasil diperbarui");
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException | SecurityException e) {
            response.put("status", "Failed");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteIncome(
            @PathVariable Long id,
            Authentication authentication) {
        
        Map<String, String> response = new HashMap<>();
        try {
            String userId = authentication.getName();
            incomeService.deleteIncome(id, userId);
            
            response.put("status", "Success");
            response.put("message", "Data pemasukan berhasil dihapus");
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException | SecurityException e) {
            response.put("status", "Failed");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}