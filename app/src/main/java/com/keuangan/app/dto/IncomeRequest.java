package com.keuangan.app.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class IncomeRequest {
    private String userId;
    private BigDecimal amount;
    private String category;
    private String description;
    private LocalDate date;
    private String akun;   // (Gopay, Ovo, BCA, dll)

    public IncomeRequest() {}

    // Getter dan Setter
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getAkun() { return akun; }
    public void setAkun(String akun) { this.akun = akun; }
}