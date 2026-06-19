package com.keuangan.app.dto.response;

public class StatSummaryDTO {
    private String bulanPengeluaranTertinggi;
    private String kategoriTerbesar;

    public StatSummaryDTO() {
    }

    public StatSummaryDTO(String bulanPengeluaranTertinggi, String kategoriTerbesar) {
        this.bulanPengeluaranTertinggi = bulanPengeluaranTertinggi;
        this.kategoriTerbesar = kategoriTerbesar;
    }

    public String getBulanPengeluaranTertinggi() {
        return bulanPengeluaranTertinggi;
    }

    public void setBulanPengeluaranTertinggi(String bulanPengeluaranTertinggi) {
        this.bulanPengeluaranTertinggi = bulanPengeluaranTertinggi;
    }

    public String getKategoriTerbesar() {
        return kategoriTerbesar;
    }

    public void setKategoriTerbesar(String kategoriTerbesar) {
        this.kategoriTerbesar = kategoriTerbesar;
    }
}