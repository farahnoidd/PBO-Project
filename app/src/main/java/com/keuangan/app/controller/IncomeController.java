package com.keuangan.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.keuangan.app.dto.IncomeRequest;
import com.keuangan.app.service.IncomeService;

@RestController
@RequestMapping("/api/income")
public class IncomeController {

    @Autowired
    private IncomeService incomeService;

    @PostMapping
    public ResponseEntity<String> createIncome(@RequestBody IncomeRequest request) {

        String result = incomeService.saveIncome(request);
        
        return ResponseEntity.ok(result);
    }
}
