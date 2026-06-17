package com.keuangan.app.controller;

import com.keuangan.app.dto.IncomeRequest;
import com.keuangan.app.service.IncomeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}