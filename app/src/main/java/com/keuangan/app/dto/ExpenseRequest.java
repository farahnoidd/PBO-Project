package com.keuangan.app.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseRequest {
    private BigDecimal nominal;
    private String kategori;
    private String keterangan;
    private LocalDate tanggal;
    private String akun;
    private boolean forceSave; // Tetap menggunakan bahasa Inggris

    public ExpenseRequest() {}

    public BigDecimal getAmount() { return nominal; }
    public void setNominal(BigDecimal nominal) { this.nominal = nominal; }

    public String getKategori() { return kategori; }
    public void setKategori(String kategori) { this.kategori = kategori; }

    public String getKeterangan() { return keterangan; }
    public void setKeterangan(String keterangan) { this.keterangan = keterangan; }

    public LocalDate getDate() { return tanggal; }
    public void setTanggal(LocalDate tanggal) { this.tanggal = tanggal; }

    public String getAkun() { return akun; }
    public void setAkun(String akun) { this.akun = akun; }

    public boolean isForceSave() { return forceSave; }
    public void setForceSave(boolean forceSave) { this.forceSave = forceSave; }
}
