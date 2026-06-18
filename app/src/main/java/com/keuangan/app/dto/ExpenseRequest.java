package com.keuangan.app.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseRequest {
    private BigDecimal amount;
    private String category;
    private String description;
    private LocalDate date;
    private String akun;
    private boolean forceSave; // Untuk bypass peringatan saldo kurang

    public ExpenseRequest() {}

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
    public boolean isForceSave() { return forceSave; }
    public void setForceSave(boolean forceSave) { this.forceSave = forceSave; }
}