package com.keuangan.app.controller;

import com.keuangan.app.dto.ExpenseRequest;
import com.keuangan.app.model.Transaction;
import com.keuangan.app.service.ExpenseService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<Transaction>> getTransactions(Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(expenseService.getAllTransactions(userId));
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> handleAddExpense(Authentication authentication, @RequestBody ExpenseRequest incomingData) {
        Map<String, String> response = new HashMap<>();
        try {
            String userId = authentication.getName();
            String result = expenseService.createExpense(incomingData, userId);
            response.put("status", "Success");
            response.put("message", result);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException exception) {
            if (exception.getMessage().equals("WARNING_INSUFFICIENT_BALANCE")) {
                response.put("status", "Warning");
                response.put("message", "Peringatan: Saldo Anda tidak mencukupi/Minus!");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response); 
            }
            response.put("status", "Failed");
            response.put("message", exception.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (IllegalArgumentException exception) {
            response.put("status", "Failed");
            response.put("message", exception.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> handleEditExpense(
        @PathVariable Long id, 
        @RequestBody ExpenseRequest updatedData,
        Authentication authentication) {

        try {
            String userId = authentication.getName();
            return ResponseEntity.ok(expenseService.updateExpense(id, updatedData, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> handleDeleteExpense(
        @PathVariable Long id,
        Authentication authentication) {

        try {
            String userId = authentication.getName();
            expenseService.deleteExpense(id, userId);
            return ResponseEntity.ok("Data transaksi berhasil dihapus");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}