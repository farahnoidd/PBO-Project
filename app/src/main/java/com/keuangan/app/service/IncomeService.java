package com.keuangan.app.service;

import com.keuangan.app.dto.IncomeRequest;
import org.springframework.stereotype.Service;

@Service
public class IncomeService {

    public String saveIncome(IncomeRequest request) {

        return "Pendapatan sebesar " + request.getAmount() + 
               " untuk '" + request.getDescription() + "' berhasil diproses di Service.";
    }
}