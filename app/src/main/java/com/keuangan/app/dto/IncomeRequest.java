package com.keuangan.app.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class IncomeRequest {
    private BigDecimal amount;
    private String description;
    private LocalDate date;
    private String category;

    // Constructor Kosong
    public IncomeRequest() {
    }

    // Constructor dengan Parameter
    public IncomeRequest(BigDecimal amount, String description, LocalDate date, String category) {
        this.amount = amount;
        this.description = description;
        this.date = date;
        this.category = category;
    }

    // Getter dan Setter
    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}