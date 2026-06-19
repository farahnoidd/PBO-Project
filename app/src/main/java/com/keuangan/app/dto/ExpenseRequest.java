package com.keuangan.app.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseRequest {
    private BigDecimal nominal;
    private String kategori;
    private String keterangan;
    private LocalDate tanggal;
    private String akun;
    private boolean forceSave; // Untuk bypass peringatan saldo kurang

    public ExpenseRequest() {}

    public BigDecimal getAmount() { return nominal; }
    public void setAmount(BigDecimal amount) { this.nominal = amount; }
    public String getCategory() { return kategori; }
    public void setCategory(String category) { this.kategori = category; }
    public String getDescription() { return keterangan; }
    public void setDescription(String description) { this.keterangan = description; }
    public LocalDate getDate() { return tanggal; }
    public void setDate(LocalDate date) { this.tanggal = date; }
    public String getAkun() { return akun; }
    public void setAkun(String akun) { this.akun = akun; }
    public boolean isForceSave() { return forceSave; }
    public void setForceSave(boolean forceSave) { this.forceSave = forceSave; }
}